import * as ratingRepo from "@/lib/repository/trip/rating-repo"

const shown = 10

export async function myReviews(userId: string) {
  const [rows, summary] = await Promise.all([ratingRepo.receivedFor(userId, shown), ratingRepo.summaryFor(userId)])
  const trips = await ratingRepo.tripLabels(rows.map((r) => r.tripId))
  const labels = new Map(trips.map((t) => [t.id, t.rideRequest]))
  const items = rows.map(({ tripId, ...r }) => ({ ...r, route: labels.get(tripId) ? `${labels.get(tripId)?.fromLabel} - ${labels.get(tripId)?.toLabel}` : null }))
  return { average: summary._avg.score, count: summary._count._all, items }
}
