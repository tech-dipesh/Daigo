import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"
import { noShowWaitMinutes } from "@/lib/infra/economy/trip-rules"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can report a no-show", 403)
  if (!trip.arrivedAt) throw new AppError("Mark yourself as arrived first", 409)
  const remainingMs = trip.arrivedAt.getTime() + noShowWaitMinutes * 60000 - Date.now()
  if (remainingMs > 0) throw new AppError(`Wait ${Math.ceil(remainingMs / 1000)} more seconds before marking a no-show`, 409)
  const updated = await db.$transaction(async (tx) => {
    const marked = await tx.trip.updateMany({ where: { id, status: "PENDING_PICKUP" }, data: { status: "NO_SHOW" } })
    if (!marked.count) throw new AppError("This trip is not waiting for pickup", 409)
    const { groupSize } = await tx.rideRequest.update({ where: { id: trip.rideRequestId }, data: { status: "EXPIRED" } })
    await tx.route.update({ where: { id: trip.routeId }, data: { seatsAvailable: { increment: groupSize } } })
    if (trip.matchId) await tx.match.update({ where: { id: trip.matchId }, data: { status: "EXPIRED" } })
    return tx.trip.findUniqueOrThrow({ where: { id } })
  })
  await publishEvent(trip.riderId, "trip.status", { tripId: id, status: updated.status })
  await notify(trip.riderId, "TRIP_STATUS", "Marked as no-show", "Your driver waited and could not find you. Retry your request any time", { tripId: id })
  return successResponse(updated)
})
