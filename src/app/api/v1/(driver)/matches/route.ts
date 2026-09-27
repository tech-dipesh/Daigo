import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  const driverId = getUserId(request)

  const matches = await db.match.findMany({
    where: { route: { driverId } },
    include: { rideRequest: true, route: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  })

  return successResponse(matches)
})
