import { randomUUID } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }

const paymentSchema = z.object({
  method: z.enum(["ONLINE", "CASH"]),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)

  if (trip.riderId !== userId) throw new AppError("Only the rider can pay for this trip", 403)
  if (trip.status !== "COMPLETED") throw new AppError("You can only pay for a completed trip", 409)

  const existing = await db.payment.findUnique({ where: { tripId: trip.id } })

  if (existing) throw new AppError("Payment has already been started for this trip", 409)

  const body = await parseJsonBody(request)
  const { method } = paymentSchema.parse(body)
  const online = method === "ONLINE"

  // mock db i'll later add a razorpay mock
  const payment = await db.payment.create({
    data: {
      tripId: trip.id,
      amount: trip.priceEstimate,
      method,
      status: online ? "PAID" : "PENDING",
      gatewayRef: online ? `mock_${randomUUID()}` : undefined,
      paidAt: online ? new Date() : undefined,
    },
  })

  return successResponse(payment, 201)
})

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)
  const payment = await db.payment.findUnique({ where: { tripId: trip.id } })

  if (!payment) throw new AppError("No payment has been started for this trip", 404)

  return successResponse(payment)
})
