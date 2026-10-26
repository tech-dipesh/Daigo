import { randomBytes, randomInt } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"
import { assertCanAccept } from "@/lib/infra/matching/booking-guard"

export type DetailedMatch = NonNullable<Awaited<ReturnType<typeof findDetailed>>>

export const findForDriver = (id: string, driverId: string) => db.match.findFirst({ where: { id, route: { driverId } }, include: { offers: { select: { id: true } } } })
export const findDetailed = (id: string) => db.match.findUnique({ where: { id }, include: { rideRequest: { include: { rider: true } }, route: true } })
export const findWithLastOffer = (id: string) => db.match.findUnique({ where: { id }, include: { rideRequest: true, route: true, offers: { orderBy: { round: "desc" }, take: 1 } } })
type Candidate = { rideRequestId: string; routeId: string; detourDistanceKm: number; priceEstimate: number; distanceKm: number }

export const upsertCandidate = ({ rideRequestId, routeId, ...data }: Candidate) =>
  db.match.upsert({
    where: { rideRequestId_routeId: { rideRequestId, routeId } },
    create: { rideRequestId, routeId, ...data },
    update: {},
    include: { route: { include: { vehicle: true } } },
  })
export const reject = (id: string) => db.match.update({ where: { id }, data: { status: "REJECTED" } })

/* the race safe part: claim request, take seats, make trip, all or nothing */
export function acceptInTransaction(match: DetailedMatch, driverId: string, price: number) {
  const { riderId, groupSize } = match.rideRequest
  return db.$transaction(async (tx) => {
    await assertCanAccept(tx, driverId, match.routeId, match.rideRequest)
    // for atomic request can't win same request.
    const claimed = await tx.rideRequest.updateMany({
      where: { id: match.rideRequestId, status: "PENDING" },
      data: { status: "MATCHED" },
    })
    if (!claimed.count) throw new AppError("This request is already matched", 409)
    const seated = await tx.route.updateMany({
      where: { id: match.routeId, status: "ACTIVE", seatsAvailable: { gte: groupSize } },
      data: { seatsAvailable: { decrement: groupSize } },
    })
    if (!seated.count) throw new AppError("This route is full or no longer active", 409)
    const trip = await tx.trip.create({
      data: {
        matchId: match.id,
        rideRequestId: match.rideRequestId,
        routeId: match.routeId,
        riderId,
        driverId,
        priceEstimate: price,
        distanceKm: match.distanceKm,
        pickupOtp: randomInt(100000, 999999).toString(),
        shareToken: match.rideRequest.minorAge === null && !match.rideRequest.passengerEmail ? undefined : randomBytes(16).toString("hex"),
      },
    })
    const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status: "ACCEPTED" } })
    return { updatedMatch, trip }
  })
}
