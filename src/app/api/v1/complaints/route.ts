import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"

const complaintSchema = z.object({
  tripId: z.uuid(),
  type: z.enum(["PAYMENT", "ROUTE", "RATING", "CONDUCT", "OTHER"]),
  text: z.string().trim().min(10).max(500),
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { tripId, type, text } = complaintSchema.parse(await parseJsonBody(request))
  const trip = await getTripForUser(tripId, userId)
  const againstId = trip.riderId === userId ? trip.driverId : trip.riderId
  const open = await db.complaint.findFirst({ where: { tripId, filedById: userId, type, status: { in: ["OPEN", "IN_REVIEW"] } } })
  if (open) throw new AppError("You already have an open complaint of this type for this trip", 409)
  const complaint = await db.complaint.create({ data: { tripId, filedById: userId, againstId, type, text } })
  return successResponse(complaint, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const complaints = await db.complaint.findMany({ where: { filedById: userId }, orderBy: { createdAt: "desc" } })
  return successResponse(complaints)
})
