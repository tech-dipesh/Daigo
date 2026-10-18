import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"

const confirmSchema = z.object({
  proofPhotoUrl: z.url(),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  if (trip.driverId !== userId) throw new AppError("Only the driver can confirm a cash payment", 403)
  const payment = await db.payment.findUnique({ where: { tripId: trip.id } })
  if (!payment) throw new AppError("No payment has been started for this trip", 404)
  if (payment.method !== "CASH") throw new AppError("Only cash payments need confirmation", 409)
  if (payment.status !== "PENDING") throw new AppError("This payment is already settled", 409)
  const body = await parseJsonBody(request)
  const { proofPhotoUrl } = confirmSchema.parse(body)
  const paid = await db.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", proofPhotoUrl, paidAt: new Date() },
  })
  await notify(trip.riderId, "PAYMENT", "Payment confirmed", "The driver confirmed your cash payment", { tripId: trip.id })
  return successResponse(paid)
})
