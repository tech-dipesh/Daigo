import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)

  const trip = await getTripForUser(id, driverId)

  if (trip.driverId !== driverId) {
    throw new AppError("Only the driver can complete The trip", 403)
  }

  if (trip.status !== "IN_PROGRESS") {
    throw new AppError("The trip is not in progress", 409)
  }

  const updated = await db.trip.update({
    where: { id: trip.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  })

  return successResponse(updated)
})
