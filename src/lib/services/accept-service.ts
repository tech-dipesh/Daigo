import { AppError } from "@/lib/infra/http/response"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { isExpired } from "@/lib/infra/matching/expiry"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import * as matchRepo from "@/lib/repository/match-repo"

type AutoCandidate = {
  id: string
  priceEstimate: number
  route: { autoAccept: boolean; autoMinPrice: number | null; autoMinPerKm: number | null; autoMinTrust: number | null }
}

/*
  one place that turns a match into a trip
  used by driver accept, offer accept and auto accept
*/
export async function acceptMatch(matchId: string, price?: number) {
  const match = await matchRepo.findDetailed(matchId)
  if (!match) throw new AppError("Match not found", 404)
  const driverId = match.route.driverId
  await requireMember(driverId)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)
  if (isExpired(match.rideRequest.expiresAt)) throw new AppError("This request has expired", 410)
  const { riderId, rider } = match.rideRequest
  const result = await matchRepo.acceptInTransaction(match, driverId, price ?? match.priceEstimate)
  const { trip } = result
  await publishEvent(riderId, "match.accepted", { tripId: trip.id, matchId: match.id })
  await notify(riderId, "MATCH_ACCEPTED", "Driver accepted", "A driver accepted your ride request", { tripId: trip.id })
  const shareNote = trip.shareToken ? `\n\nFollow the trip live: ${env.APP_URL}/api/v1/trips/shared/${trip.shareToken}` : ""
  await sendEmailBestEffort({
    to: rider.email,
    subject: "Your DaiGo pickup code",
    text: `Your driver has accepted your request. Share this code at pickup: ${trip.pickupOtp}${shareNote}`,
  })
  const passengerEmail = match.rideRequest.passengerEmail
  if (passengerEmail) {
    await sendEmailBestEffort({
      to: passengerEmail,
      subject: "A DaiGo ride was booked for you",
      text: `${rider.email} booked a ride for you. Give this code to the driver at pickup: ${trip.pickupOtp}${shareNote}`,
    })
  }
  return result
}

export async function tryAutoAccept(candidates: AutoCandidate[], riderTrust: number, km: number) {
  const perKm = (price: number) => price / Math.max(km, 1)
  const enabled = candidates.filter((m) => m.route.autoAccept)
  const eligible = enabled.filter((m) => m.priceEstimate >= (m.route.autoMinPrice ?? 0) && perKm(m.priceEstimate) >= (m.route.autoMinPerKm ?? 0) && riderTrust >= (m.route.autoMinTrust ?? 0))
  for (const candidate of eligible) {
    try {
      return await acceptMatch(candidate.id)
    } catch (error) {
      if (!(error instanceof AppError)) throw error
    }
  }
  return null
}
