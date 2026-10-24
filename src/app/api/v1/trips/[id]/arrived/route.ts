import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import * as tripRepo from "@/lib/repository/trip-repo"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can mark arrival", 403)
  if (trip.status !== "PENDING_PICKUP") throw new AppError("This trip is not waiting for pickup", 409)
  if (trip.arrivedAt) return successResponse(trip)
  const updated = await tripRepo.markArrived(id)
  await publishEvent(trip.riderId, "trip.status", { tripId: id, status: updated.status, arrivedAt: updated.arrivedAt })
  await notify(trip.riderId, "TRIP_STATUS", "Driver arrived", "Your driver is at the pickup point, share your pickup code", { tripId: id })
  return successResponse(updated)
})
