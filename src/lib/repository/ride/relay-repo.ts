import { randomInt } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"

export type RelayForDriver = NonNullable<Awaited<ReturnType<typeof findForDriver>>>

export const findForDriver = (id: string, driverId: string) =>
  db.relayMatch.findFirst({
    where: { id, OR: [{ firstRoute: { driverId } }, { secondRoute: { driverId } }] },
    include: { firstRoute: true, secondRoute: true, rideRequest: { include: { rider: true } } },
  })

type RelayCandidate = { rideRequestId: string; firstRouteId: string; secondRouteId: string; transferLat: number; transferLng: number; priceEstimate: number }

export const upsertCandidate = ({ rideRequestId, firstRouteId, secondRouteId, ...data }: RelayCandidate) =>
  db.relayMatch.upsert({
    where: { rideRequestId_firstRouteId_secondRouteId: { rideRequestId, firstRouteId, secondRouteId } },
    create: { rideRequestId, firstRouteId, secondRouteId, ...data },
    update: {},
    include: { firstRoute: { include: { vehicle: true } }, secondRoute: { include: { vehicle: true } } },
  })

/* each driver answers their own leg, trips only exist once both said yes */
export function recordLeg(relayMatch: RelayForDriver, driverId: string, status: "ACCEPTED" | "REJECTED") {
  const leg = relayMatch.firstRoute.driverId === driverId ? "first" : "second"
  return db.$transaction(async (tx) => {
    const legField = leg === "first" ? "firstLegStatus" : "secondLegStatus"
    const relay = await tx.relayMatch.update({
      where: { id: relayMatch.id },
      data: { [legField]: status },
    })
    if (status === "REJECTED") {
      return { relay: await tx.relayMatch.update({ where: { id: relay.id }, data: { status: "REJECTED" } }), trips: [] }
    }
    const bothAccepted = relay.firstLegStatus === "ACCEPTED" && relay.secondLegStatus === "ACCEPTED"
    if (!bothAccepted) return { relay, trips: [] }
    const { groupSize, riderId } = relayMatch.rideRequest
    const claimed = await tx.rideRequest.updateMany({
      where: { id: relayMatch.rideRequestId, status: "PENDING" },
      data: { status: "MATCHED" },
    })
    if (!claimed.count) throw new AppError("This request is already matched", 409)
    const trips = []
    for (const [routeId, routeDriverId, relayLeg] of [
      [relayMatch.firstRouteId, relayMatch.firstRoute.driverId, "FIRST"],
      [relayMatch.secondRouteId, relayMatch.secondRoute.driverId, "SECOND"],
    ] as const) {
      const seated = await tx.route.updateMany({
        where: { id: routeId, status: "ACTIVE", seatsAvailable: { gte: groupSize } },
        data: { seatsAvailable: { decrement: groupSize } },
      })
      if (!seated.count) throw new AppError("A leg of this relay is no longer available", 409)
      trips.push(
        await tx.trip.create({
          data: {
            relayMatchId: relay.id,
            relayLeg,
            rideRequestId: relayMatch.rideRequestId,
            routeId,
            riderId,
            driverId: routeDriverId,
            priceEstimate: relay.priceEstimate,
            pickupOtp: randomInt(100000, 999999).toString(),
          },
        }),
      )
    }
    return { relay: await tx.relayMatch.update({ where: { id: relay.id }, data: { status: "CONFIRMED" } }), trips }
  })
}
