import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import { pingIsFresh } from "@/lib/infra/economy/minor"
import type { RouteParams } from "@/types/api"

const verifyPickupSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) {
    throw new AppError("Only the driver can verify pickup", 403)
  }
  if (trip.status !== "PENDING_PICKUP") {
    throw new AppError("This trip is not waiting for pickup", 409)
  }
  const body = await parseJsonBody(request)
  const { otp } = verifyPickupSchema.parse(body)
  if (otp !== trip.pickupOtp) {
    throw new AppError("Incorrect pickup code", 400)
  }
  const { minorAge } = await db.rideRequest.findUniqueOrThrow({ where: { id: trip.rideRequestId }, select: { minorAge: true } })
  if (minorAge !== null && !pingIsFresh(trip.lastLocationAt)) throw new AppError("Share your live location before picking up a child", 409)
  const updated = await db.trip.update({
    where: { id: trip.id },
    data: { status: "IN_PROGRESS", otpVerifiedAt: new Date() },
  })
  await publishEvent(trip.riderId, "trip.status", { tripId: trip.id, status: updated.status })
  await notify(trip.riderId, "TRIP_STATUS", "Trip started", "Your pickup was verified and the trip has started", { tripId: trip.id })
  return successResponse(updated)
})
