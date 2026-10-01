import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { parseJsonBody } from "@/lib/infra/request"
import { getTripForUser } from "@/lib/infra/trip-access"
import { cancellationPenalty, clampTrust } from "@/lib/infra/trust"

type RouteParams = { params: Promise<{ id: string }> }

const cancelSchema = z.object({
  reason: z.string().max(300).optional(),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)

  const trip = await getTripForUser(id, userId)

  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    throw new AppError("The trip can no longer be cancelled", 409)
  }

  const body = await parseJsonBody(request)
  const { reason } = cancelSchema.parse(body)

  const cancelledBy = trip.riderId === userId ? "RIDER" : "DRIVER"
  const minutesSinceCommit = (Date.now() - trip.createdAt.getTime()) / 60000

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

    const { trustScore } = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { trustScore: true },
    })

    await tx.user.update({
      where: { id: userId },
      data: { trustScore: clampTrust(trustScore - cancellationPenalty(cancelledBy, minutesSinceCommit)) },
    })

    return cancelledTrip
  })

  return successResponse(updated)
})
