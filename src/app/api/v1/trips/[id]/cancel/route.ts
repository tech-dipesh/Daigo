import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { cancellationPenalty } from "@/lib/infra/economy/trust"
import * as tripRepo from "@/lib/repository/trip-repo"
import * as userRepo from "@/lib/repository/user-repo"
import { cancellationGamingThreshold, cancellationWindowHours } from "@/lib/infra/economy/abuse"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import { issueWarning } from "@/lib/infra/economy/warnings"
import type { RouteParams } from "@/types/api"
import { cancelSchema } from "@/lib/validation/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED" || trip.status === "NO_SHOW") {
    throw new AppError("This trip can no longer be cancelled", 409)
  }
  const body = await parseJsonBody(request)
  const { reason } = cancelSchema.parse(body)
  const cancelledBy = trip.riderId === userId ? "RIDER" : "DRIVER"
  const windowStart = new Date(Date.now() - cancellationWindowHours * 60 * 60 * 1000)
  const recentCancellations = await tripRepo.countRecentCancellations(userId, cancelledBy, windowStart)
  // repeated rapid cancelling is suspicious on its own - the early-cancel grace
  // period only makes sense for someone cancelling occasionally, not gaming it
  const isGaming = recentCancellations >= cancellationGamingThreshold
  const minutesSinceCommit = isGaming ? Number.POSITIVE_INFINITY : (Date.now() - trip.createdAt.getTime()) / 60000
  const penalty = cancellationPenalty(cancelledBy, minutesSinceCommit)
  const updated = await db.$transaction(async (tx) => {
    const cancelledTrip = await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", cancelledBy, cancelReason: reason, cancelledAt: new Date() },
    })
    const { groupSize } = await tx.rideRequest.update({
      where: { id: trip.rideRequestId },
      data: { status: "PENDING" },
    })
    await tx.route.update({
      where: { id: trip.routeId },
      data: { seatsAvailable: { increment: groupSize } },
    })
    if (trip.matchId) {
      await tx.match.update({ where: { id: trip.matchId }, data: { status: "EXPIRED" } })
    }
    await userRepo.adjustTrust(tx, userId, -penalty)
    return cancelledTrip
  })
  if (isGaming) await issueWarning(userId, "CANCEL_GAMING", "Too many cancellations in a short time", trip.id)
  const other = cancelledBy === "RIDER" ? trip.driverId : trip.riderId
  await publishEvent(other, "trip.status", { tripId: trip.id, status: updated.status })
  await notify(other, "TRIP_STATUS", "Trip cancelled", "The other person cancelled this trip", { tripId: trip.id })
  return successResponse(updated)
})
