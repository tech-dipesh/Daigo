import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { cabRate, moneySaved } from "@/lib/infra/economy/savings"

export const GET = withErrorHandling(async (request) => {
  const riderId = getUserId(request)
  const [completed, recent, active, cab] = await Promise.all([
    db.trip.findMany({ where: { riderId, status: "COMPLETED" }, select: { priceEstimate: true, distanceKm: true } }),
    db.trip.findMany({ where: { riderId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, priceEstimate: true, createdAt: true } }),
    db.trip.findFirst({ where: { riderId, status: { in: ["PENDING_PICKUP", "IN_PROGRESS"] } }, select: { id: true, status: true, priceEstimate: true } }),
    cabRate(),
  ])
  const totalSpent = completed.reduce((sum, t) => sum + t.priceEstimate, 0)
  const savedEach = completed.map((t) => moneySaved(t.distanceKm, t.priceEstimate, cab))
  const saved = savedEach.reduce((sum, n) => sum + n, 0)
  return successResponse({ completedTrips: completed.length, totalSpent, moneySaved: saved, activeTrip: active, recentTrips: recent })
})
