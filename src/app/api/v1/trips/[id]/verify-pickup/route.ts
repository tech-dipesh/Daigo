import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { parseJsonBody } from "@/lib/infra/request"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }

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

  const updated = await db.trip.update({
    where: { id: trip.id },
    data: { status: "IN_PROGRESS", otpVerifiedAt: new Date() },
  })

  return successResponse(updated)
})
