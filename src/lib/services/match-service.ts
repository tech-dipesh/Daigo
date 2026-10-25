import { AppError } from "@/lib/infra/http/response"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { requireMember } from "@/lib/infra/auth/require-verified"
import * as matchRepo from "@/lib/repository/match-repo"
import * as relayRepo from "@/lib/repository/relay-repo"
import type { MatchDecisionInput, RelayDecisionInput } from "@/lib/validation/match-schema"
import { acceptMatch } from "@/lib/services/accept-service"

export async function decideMatch(driverId: string, id: string, { status }: MatchDecisionInput) {
  const match = await matchRepo.findForDriver(id, driverId)
  if (!match) throw new AppError("Match not found", 404)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)
  if (status === "ACCEPTED") {
    if (match.offers.length) throw new AppError("This match has offers, answer them from the offers endpoints", 409)
    const { updatedMatch } = await acceptMatch(id)
    return updatedMatch
  }
  return matchRepo.reject(id)
}

export async function decideRelay(driverId: string, id: string, { status }: RelayDecisionInput) {
  await requireMember(driverId)
  const relayMatch = await relayRepo.findForDriver(id, driverId)
  if (!relayMatch) throw new AppError("Relay match not found", 404)
  if (relayMatch.status !== "PENDING") throw new AppError("This relay has already been decided", 409)
  const result = await relayRepo.recordLeg(relayMatch, driverId, status)
  for (const trip of result.trips) {
    await sendEmailBestEffort({
      to: relayMatch.rideRequest.rider.email,
      subject: trip.relayLeg === "FIRST" ? "Your DaiGo pickup code (leg 1 of 2)" : "Your DaiGo transfer code (leg 2 of 2)",
      text: `Share this code at pickup: ${trip.pickupOtp}`,
    })
  }
  return result.relay
}
