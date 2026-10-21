import { randomBytes, randomInt } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { assertCanAccept } from "@/lib/infra/matching/booking-guard"
import { isExpired } from "@/lib/infra/matching/expiry"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"

/*
  one place that turns a match into a trip
  used by driver accept, offer accept and auto accept
*/
export async function acceptMatch(matchId: string, price?: number) {
  const match = await db.match.findUnique({ where: { id: matchId }, include: { rideRequest: { include: { rider: true } }, route: true } })
  if (!match) throw new AppError("Match not found", 404)
  const driverId = match.route.driverId
  await requireMember(driverId)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)
  if (isExpired(match.rideRequest.expiresAt)) throw new AppError("This request has expired", 410)
  const { riderId, groupSize, rider } = match.rideRequest
  const result = await db.$transaction(async (tx) => {
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
        priceEstimate: price ?? match.priceEstimate,
        pickupOtp: randomInt(100000, 999999).toString(),
        shareToken: match.rideRequest.minorAge === null ? undefined : randomBytes(16).toString("hex"),
      },
    })
    const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status: "ACCEPTED" } })
    return { updatedMatch, trip }
  })
  const { trip } = result
  await publishEvent(riderId, "match.accepted", { tripId: trip.id, matchId: match.id })
  await notify(riderId, "MATCH_ACCEPTED", "Driver accepted", "A driver accepted your ride request", { tripId: trip.id })
  const shareNote = trip.shareToken ? `\n\nFollow the trip live: ${env.APP_URL}/api/v1/trips/shared/${trip.shareToken}` : ""
  await sendEmailBestEffort({
    to: rider.email,
    subject: "Your DaiGo pickup code",
    text: `Your driver has accepted your request. Share this code at pickup: ${trip.pickupOtp}${shareNote}`,
  })
  return result
}
