import { db } from "@/lib/infra/clients/db"

const same = "insensitive" as const
/* 
  The staff which is not touch even it's a email is matched.
*/
export async function demoUserIds(domain: string, liveEmail: string | undefined) {
  const byDomain = { email: { endsWith: domain, mode: same } }
  const live = liveEmail ? [{ email: { equals: liveEmail, mode: same } }] : []
  const users = await db.user.findMany({ where: { staffRole: null, OR: [byDomain, ...live] }, select: { id: true } })
  return users.map((user) => user.id)
}

export const ping = async () => {
  const [row] = await db.$queryRaw<{ v: string }[]>`SELECT postgis_version() AS v`
  return row?.v ?? "no postgis"
}

export const counts = (ids: string[]) =>
  Promise.all([
    db.user.count({ where: { id: { in: ids } } }),
    db.vehicle.count({ where: { ownerId: { in: ids } } }),
    db.route.count({ where: { driverId: { in: ids } } }),
    db.rideRequest.count({ where: { riderId: { in: ids } } }),
    db.trip.count({ where: { OR: [{ riderId: { in: ids } }, { driverId: { in: ids } }] } }),
  ])

async function relatedIds(ids: string[]) {
  const user = { in: ids }
  const [trips, requests, routes] = await Promise.all([
    db.trip.findMany({ where: { OR: [{ riderId: user }, { driverId: user }] }, select: { id: true } }),
    db.rideRequest.findMany({ where: { riderId: user }, select: { id: true } }),
    db.route.findMany({ where: { driverId: user }, select: { id: true } }),
  ])
  const [tripIds, requestIds, routeIds] = [trips, requests, routes].map((rows) => rows.map((row) => row.id))
  const matches = await db.match.findMany({ where: { OR: [{ rideRequestId: { in: requestIds } }, { routeId: { in: routeIds } }] }, select: { id: true } })
  return { tripIds, requestIds, routeIds, matchIds: matches.map((match) => match.id) }
}

export async function wipe(ids: string[]) {
  const { tripIds, requestIds, routeIds, matchIds } = await relatedIds(ids)
  const user = { in: ids }
  const trip = { in: tripIds }
  return db.$transaction([
    db.paymentShare.deleteMany({ where: { payment: { tripId: trip } } }),
    db.payment.deleteMany({ where: { tripId: trip } }),
    db.rating.deleteMany({ where: { tripId: trip } }),
    db.emergencyEvent.deleteMany({ where: { OR: [{ tripId: trip }, { userId: user }] } }),
    db.trip.deleteMany({ where: { id: trip } }),
    db.offer.deleteMany({ where: { matchId: { in: matchIds } } }),
    db.match.deleteMany({ where: { id: { in: matchIds } } }),
    db.relayMatch.deleteMany({ where: { OR: [{ rideRequestId: { in: requestIds } }, { firstRouteId: { in: routeIds } }, { secondRouteId: { in: routeIds } }] } }),
    db.waitlist.deleteMany({ where: { OR: [{ requestId: { in: requestIds } }, { riderId: user }] } }),
    db.rideRequest.deleteMany({ where: { id: { in: requestIds } } }),
    db.permanentRideRequest.deleteMany({ where: { riderId: user } }),
    db.route.deleteMany({ where: { id: { in: routeIds } } }),
    db.vehicle.deleteMany({ where: { ownerId: user } }),
    db.driverDocument.deleteMany({ where: { userId: user } }),
    db.notification.deleteMany({ where: { userId: user } }),
    db.appeal.deleteMany({ where: { userId: user } }),
    db.warning.deleteMany({ where: { userId: user } }),
    db.complaint.deleteMany({ where: { OR: [{ filedById: user }, { againstId: user }] } }),
    db.coinTransaction.deleteMany({ where: { userId: user } }),
    db.upload.deleteMany({ where: { userId: user } }),
    db.otpCode.deleteMany({ where: { userId: user } }),
    db.verificationToken.deleteMany({ where: { userId: user } }),
    db.refreshToken.deleteMany({ where: { userId: user } }),
    db.emergencyContact.deleteMany({ where: { userId: user } }),
    db.savedRoute.deleteMany({ where: { userId: user } }),
    db.user.deleteMany({ where: { id: user } }),
  ])
}
