import { AppError } from "@/lib/infra/http/response"
import * as boardRepo from "@/lib/repository/ride/board-repo"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"

export async function getBoard(riderId: string, requestId: string) {
  const request = await rideRequestRepo.findOwned(requestId, riderId)
  if (!request) throw new AppError("Request not found", 404)
  const rows = await boardRepo.boardMatches(requestId, riderId)
  const stats = await boardRepo.ratingsFor(rows.map((m) => m.route.driverId))
  const items = rows.map((m) => {
    const stat = stats.find((s) => s.ratedUserId === m.route.driverId)
    const last = m.offers[0]
    const { type, make, model } = m.route.vehicle
    return {
      matchId: m.id,
      price: m.priceEstimate,
      detourKm: m.detourDistanceKm,
      vehicle: { type, make, model },
      driver: { name: m.route.driver.name?.split(" ")[0] ?? null, trustScore: m.route.driver.trustScore, photo: m.route.driver.profilePhotoUrl, ratingAvg: stat?._avg.score ?? null, ratingCount: stat?._count._all ?? 0 },
      lastOffer: last ? { by: last.by, price: last.price, round: last.round, expiresAt: last.expiresAt } : null,
    }
  })
  return { status: request.status, expiresAt: request.expiresAt, items }
}
