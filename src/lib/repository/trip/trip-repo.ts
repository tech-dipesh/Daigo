import { db } from "@/lib/infra/clients/db"
import { awardCoins, tripCompletionCoins } from "@/lib/infra/economy/coins"
import * as userRepo from "@/lib/repository/account/user-repo"

type Booked = { id: string; rideRequestId: string; routeId: string; matchId: string | null }

export const listForUser = (userId: string) => db.trip.findMany({ where: { OR: [{ riderId: userId }, { driverId: userId }] }, orderBy: { createdAt: "desc" } })

export const completedWithDrivers = (riderId: string) =>
  db.trip.findMany({ where: { riderId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { id: true, driverId: true, completedAt: true, driver: { select: { id: true, name: true, email: true, trustScore: true, isBanned: true } } } })

export const countRecentCancellations = (userId: string, cancelledBy: "RIDER" | "DRIVER", since: Date) =>
  db.trip.count({ where: { cancelledBy, status: "CANCELLED", cancelledAt: { gte: since }, OR: [{ riderId: userId }, { driverId: userId }] } })

export const markArrived = (id: string) => db.trip.update({ where: { id }, data: { arrivedAt: new Date() } })
export const startTrip = (id: string) => db.trip.update({ where: { id }, data: { status: "IN_PROGRESS", otpVerifiedAt: new Date() } })

export const findRelayLeg = (relayMatchId: string | null, relayLeg: "FIRST" | "SECOND") => db.trip.findFirst({ where: { relayMatchId, relayLeg } })

export const completeWithCoins = (trip: { id: string; riderId: string; driverId: string }) =>
  db.$transaction(async (tx) => {
    const completed = await tx.trip.update({ where: { id: trip.id }, data: { status: "COMPLETED", completedAt: new Date() } })
    await awardCoins(tx, trip.riderId, tripCompletionCoins, "trip completed")
    await awardCoins(tx, trip.driverId, tripCompletionCoins, "trip completed")
    return completed
  })

/* seat goes back, request reopens, and the penalty lands in the same transaction */
export const cancelAndRelease = (trip: Booked, userId: string, cancelledBy: "RIDER" | "DRIVER", reason: string | undefined, penalty: number) =>
  db.$transaction(async (tx) => {
    const cancelledTrip = await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", cancelledBy, cancelReason: reason, cancelledAt: new Date() },
    })
    const { groupSize } = await tx.rideRequest.update({ where: { id: trip.rideRequestId }, data: { status: "PENDING" } })
    await tx.route.update({ where: { id: trip.routeId }, data: { seatsAvailable: { increment: groupSize } } })
    if (trip.matchId) {
      await tx.match.update({ where: { id: trip.matchId }, data: { status: "EXPIRED" } })
    }
    await userRepo.adjustTrust(tx, userId, -penalty)
    return cancelledTrip
  })

/* no show closes the request for good, no trust change for the rider */
export const markNoShow = (trip: Booked) =>
  db.$transaction(async (tx) => {
    const marked = await tx.trip.updateMany({ where: { id: trip.id, status: "PENDING_PICKUP" }, data: { status: "NO_SHOW" } })
    if (!marked.count) return null
    const { groupSize } = await tx.rideRequest.update({ where: { id: trip.rideRequestId }, data: { status: "EXPIRED" } })
    await tx.route.update({ where: { id: trip.routeId }, data: { seatsAvailable: { increment: groupSize } } })
    if (trip.matchId) await tx.match.update({ where: { id: trip.matchId }, data: { status: "EXPIRED" } })
    return tx.trip.findUniqueOrThrow({ where: { id: trip.id } })
  })

export const saveNoShowReason = (id: string, riderId: string, reason: string, bonus: number) =>
  db.$transaction(async (tx) => {
    await userRepo.adjustTrust(tx, riderId, bonus)
    return tx.trip.update({ where: { id }, data: { noShowReason: reason } })
  })

export const findWithLocationContext = (id: string) => db.trip.findUnique({ where: { id }, include: { rideRequest: true, route: { include: { vehicle: true } }, driver: true } })
export const findWithPeople = (id: string) => db.trip.findUniqueOrThrow({ where: { id }, include: { rideRequest: true, rider: true, driver: true, route: { include: { vehicle: true } } } })
export const findBySharedToken = (shareToken: string) => db.trip.findUnique({ where: { shareToken }, include: { rideRequest: true, route: { include: { vehicle: true } } } })
export const findCompletedOwned = (id: string, riderId: string) => db.trip.findFirst({ where: { id, riderId, status: "COMPLETED" }, include: { rideRequest: true } })
export const setShareToken = (id: string, shareToken: string | null) => db.trip.update({ where: { id }, data: { shareToken } })
export const saveLocation = (id: string, lat: number, lng: number, isDeviated: boolean) => db.trip.update({ where: { id }, data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date(), isDeviated } })

export const completedForRider = (riderId: string) => db.trip.findMany({ where: { riderId, status: "COMPLETED" }, select: { priceEstimate: true, distanceKm: true } })
export const recentForRider = (riderId: string) => db.trip.findMany({ where: { riderId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, priceEstimate: true, createdAt: true } })
export const activeForRider = (riderId: string) => db.trip.findFirst({ where: { riderId, status: { in: ["PENDING_PICKUP", "IN_PROGRESS"] } }, select: { id: true, status: true, priceEstimate: true } })
export const completedSummaryForDriver = (driverId: string) => db.trip.aggregate({ where: { driverId, status: "COMPLETED" }, _count: { _all: true }, _sum: { priceEstimate: true } })
export const upcomingCountForDriver = (driverId: string) => db.trip.count({ where: { driverId, status: "PENDING_PICKUP" } })
export const hasActiveTrip = async (userId: string) => (await db.trip.count({ where: { OR: [{ riderId: userId }, { driverId: userId }], status: { in: ["PENDING_PICKUP", "IN_PROGRESS"] } } })) > 0
export const setArrivedAt = (id: string, arrivedAt: Date) => db.trip.update({ where: { id }, data: { arrivedAt } })
