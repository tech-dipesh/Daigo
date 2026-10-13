import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { awardCoins, tripCompletionCoins } from "@/lib/infra/economy/coins"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) {
    throw new AppError("Only the driver can complete this trip", 403)
  }
  if (trip.status !== "IN_PROGRESS") {
    throw new AppError("This trip is not in progress", 409)
  }
  const updated = await db.$transaction(async (tx) => {
    const completed = await tx.trip.update({
      where: { id: trip.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    })
    await awardCoins(tx, trip.riderId, tripCompletionCoins, "trip completed")
    await awardCoins(tx, trip.driverId, tripCompletionCoins, "trip completed")
    return completed
  })
  return successResponse(updated)
})
