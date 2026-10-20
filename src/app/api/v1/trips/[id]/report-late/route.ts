import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"
import { clampTrust } from "@/lib/infra/economy/trust"
import { issueWarning } from "@/lib/infra/economy/warnings"
import { lateArrivalPenalty, lateReportMinutes } from "@/lib/infra/economy/trip-rules"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, riderId)
  if (trip.riderId !== riderId) throw new AppError("Only the rider can report a late driver", 403)
  if (trip.status !== "PENDING_PICKUP" || trip.arrivedAt) throw new AppError("This trip is not waiting on the driver", 409)
  if (trip.lateReportedAt) throw new AppError("You already reported this trip", 409)
  const { windowStart } = await db.rideRequest.findUniqueOrThrow({ where: { id: trip.rideRequestId }, select: { windowStart: true } })
  if (Date.now() < windowStart.getTime() + lateReportMinutes * 60000) throw new AppError(`A driver is late only ${lateReportMinutes} minutes after your pickup time`, 409)
  const updated = await db.trip.update({ where: { id }, data: { lateReportedAt: new Date() } })
  const { trustScore } = await db.user.findUniqueOrThrow({ where: { id: trip.driverId }, select: { trustScore: true } })
  await db.user.update({ where: { id: trip.driverId }, data: { trustScore: clampTrust(trustScore - lateArrivalPenalty) } })
  await issueWarning(trip.driverId, "LATE_ARRIVAL", "Rider reported that you did not arrive in time", id)
  await notify(trip.driverId, "TRIP_STATUS", "Late arrival reported", "The rider reported that you have not arrived yet", { tripId: id })
  await publishEvent(trip.driverId, "trip.status", { tripId: id, status: updated.status })
  return successResponse(updated)
})
