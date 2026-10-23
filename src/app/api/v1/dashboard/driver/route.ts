import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  const driverId = getUserId(request)
  const [completed, ratings, recentRatings, upcoming] = await Promise.all([
    db.trip.aggregate({ where: { driverId, status: "COMPLETED" }, _count: { _all: true }, _sum: { priceEstimate: true } }),
    db.rating.aggregate({ where: { ratedUserId: driverId }, _avg: { score: true }, _count: { _all: true } }),
    db.rating.findMany({ where: { ratedUserId: driverId }, orderBy: { createdAt: "desc" }, take: 10, select: { score: true, createdAt: true } }),
    db.trip.count({ where: { driverId, status: "PENDING_PICKUP" } }),
  ])
  const rating = { average: ratings._avg.score, count: ratings._count._all, recent: recentRatings }
  return successResponse({ completedTrips: completed._count._all, totalEarned: completed._sum.priceEstimate ?? 0, upcomingTrips: upcoming, rating })
})
