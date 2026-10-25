import { AppError } from "@/lib/infra/http/response"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { issueWarning } from "@/lib/infra/economy/warnings"
import { isExpired } from "@/lib/infra/matching/expiry"
import { maxRounds, offerBounds, offerWindowSeconds } from "@/lib/infra/matching/offers"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import * as matchRepo from "@/lib/repository/match-repo"
import * as offerRepo from "@/lib/repository/offer-repo"
import type { OfferInput } from "@/lib/validation/match-schema"
import { acceptMatch } from "@/lib/services/accept-service"

async function loadParty(id: string, userId: string) {
  const match = await matchRepo.findWithLastOffer(id)
  const party: "DRIVER" | "RIDER" | null = match?.route.driverId === userId ? "DRIVER" : match?.rideRequest.riderId === userId ? "RIDER" : null
  if (!match || !party) throw new AppError("Match not found", 404)
  return { match, party, last: match.offers[0] ?? null }
}

export async function getOffers(userId: string, id: string) {
  const { match, last } = await loadParty(id, userId)
  const offers = await offerRepo.listByMatch(id)
  const nextRound = (last?.round ?? 0) + 1
  const bounds = await offerBounds(match, nextRound)
  return { offers, nextRound: nextRound > maxRounds ? null : nextRound, bounds }
}

export async function makeOffer(userId: string, id: string, { price }: OfferInput) {
  await requireMember(userId)
  const { match, party, last } = await loadParty(id, userId)
  if (match.status !== "PENDING") throw new AppError("This match is already decided", 409)
  if (last && last.by === party) throw new AppError("Wait for the other side to answer your offer", 409)
  if (last && last.expiresAt < new Date()) throw new AppError("The last offer expired", 410)
  if (!last && isExpired(match.rideRequest.expiresAt)) throw new AppError("This request has expired", 410)
  const round = (last?.round ?? 0) + 1
  if (round > maxRounds) throw new AppError("No offer rounds left", 409)
  const { low, high, hardCap } = await offerBounds(match, round)
  if (price > hardCap && party === "DRIVER") await issueWarning(userId, "PRICE_OVER_CAP", "You asked for more than the price cap", undefined)
  if (price < low || price > high) throw new AppError(`Offer must be between ${low} and ${high}`, 422)
  const expiresAt = new Date(Date.now() + offerWindowSeconds * 1000)
  const offer = await offerRepo.createAndExtend({ matchId: id, rideRequestId: match.rideRequestId, round, by: party, price, expiresAt })
  const other = party === "DRIVER" ? match.rideRequest.riderId : match.route.driverId
  await publishEvent(other, "offer.new", { matchId: id, offerId: offer.id, round, price, expiresAt })
  await notify(other, "OFFER", "New price offer", `The other side offered ${price} rupees (round ${round} of ${maxRounds})`, { matchId: id, round, price })
  return offer
}

export async function acceptOffer(userId: string, id: string) {
  await requireMember(userId)
  const { party, last } = await loadParty(id, userId)
  if (!last || last.by === party) throw new AppError("There is no offer waiting for your answer", 409)
  if (last.expiresAt < new Date()) throw new AppError("This offer expired", 410)
  const { trip } = await acceptMatch(id, last.price)
  return { tripId: trip.id, price: last.price }
}
