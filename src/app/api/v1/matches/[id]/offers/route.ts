import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { issueWarning } from "@/lib/infra/economy/warnings"
import { isExpired } from "@/lib/infra/matching/expiry"
import { maxRounds, offerBounds, offerWindowSeconds } from "@/lib/infra/matching/offers"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"
import { offerSchema } from "@/lib/validation/match-schema"

async function loadMatch(id: string, userId: string) {
  const match = await db.match.findUnique({ where: { id }, include: { rideRequest: true, route: true, offers: { orderBy: { round: "desc" }, take: 1 } } })
  const party: "DRIVER" | "RIDER" | null = match?.route.driverId === userId ? "DRIVER" : match?.rideRequest.riderId === userId ? "RIDER" : null
  if (!match || !party) throw new AppError("Match not found", 404)
  return { match, party, last: match.offers[0] ?? null }
}

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const { match, last } = await loadMatch(id, userId)
  const offers = await db.offer.findMany({ where: { matchId: id }, orderBy: { round: "asc" } })
  const nextRound = (last?.round ?? 0) + 1
  const bounds = await offerBounds(match, nextRound)
  return successResponse({ offers, nextRound: nextRound > maxRounds ? null : nextRound, bounds })
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  await requireMember(userId)
  const id = await idFrom(params)
  const { price } = offerSchema.parse(await parseJsonBody(request))
  const { match, party, last } = await loadMatch(id, userId)
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
  const offer = await db.$transaction(async (tx) => {
    const created = await tx.offer.create({ data: { matchId: id, round, by: party, price, expiresAt } })
    await tx.rideRequest.update({ where: { id: match.rideRequestId }, data: { expiresAt } })
    return created
  })
  const other = party === "DRIVER" ? match.rideRequest.riderId : match.route.driverId
  await publishEvent(other, "offer.new", { matchId: id, offerId: offer.id, round, price, expiresAt })
  await notify(other, "OFFER", "New price offer", `The other side offered ${price} rupees (round ${round} of ${maxRounds})`, { matchId: id, round, price })
  return successResponse(offer, 201)
})
