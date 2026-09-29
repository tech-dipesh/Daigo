import { randomUUID } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }
export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)

  if (trip.riderId !== userId) throw new AppError("Only the rider can pay for this trip", 403)
  if (trip.status !== "COMPLETED") throw new AppError("You can only pay for a completed trip", 409)

    return successResponse("Success", 201)
})

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)
  const payment = await db.payment.findUnique({ where: { tripId: trip.id } })

  if (!payment) throw new AppError("No payment has been started for this trip", 404)

  return successResponse(payment)
})
