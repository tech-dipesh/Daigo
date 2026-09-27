import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }

const cancelSchema = z.object({
  reason: z.string().max(300).optional(),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)

  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    throw new AppError("This trip can no longer be cancelled", 409)
  }

  const body = await parseJsonBody(request)
  const { reason } = cancelSchema.parse(body)

  const cancelledBy = trip.riderId === userId ? "RIDER" : "DRIVER"

  const updated = await db.$transaction(async (tx) => {
    const cancelledTrip = await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", cancelledBy, cancelReason: reason, cancelledAt: new Date() },
    })

    await tx.route.update({
      where: { id: trip.routeId },
      data: { seatsAvailable: { increment: 1 } },
    })

    await tx.rideRequest.update({
      where: { id: trip.rideRequestId },
      data: { status: "PENDING" },
    })

    return cancelledTrip
  })

  return successResponse(updated)
})
