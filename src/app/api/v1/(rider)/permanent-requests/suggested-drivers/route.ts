import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
export const GET = withErrorHandling(async (request) => {
  const riderId = getUserId(request)
  const goodRatings = await db.rating.findMany({
    where: { raterId: riderId, score: { gte: 4 } },
    include: { ratedUser: { select: { id: true, email: true, trustScore: true } } },
    orderBy: { score: "desc" },
  })
  const ratedDrivers = goodRatings.map((rating) => rating.ratedUser)
  const seen = new Set<string>()
  const drivers = ratedDrivers.filter((driver) => (seen.has(driver.id) ? false : seen.add(driver.id)))
  return successResponse(drivers)
})
