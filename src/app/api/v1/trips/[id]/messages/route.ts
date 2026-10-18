import { z } from "zod"
import { getUserId } from "@/lib/infra/auth/auth"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { pushMessage, readMessages } from "@/lib/infra/realtime/chat"
import type { RouteParams } from "@/types/api"

const messageSchema = z.object({
  text: z.string().trim().min(1).max(500),
})

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  const messages = await readMessages(trip.id)
  return successResponse(messages)
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  if (trip.status !== "PENDING_PICKUP" && trip.status !== "IN_PROGRESS") throw new AppError("Chat is closed for this trip", 409)
  const { text } = messageSchema.parse(await parseJsonBody(request))
  const message = await pushMessage(trip.id, userId, text)
  const other = trip.riderId === userId ? trip.driverId : trip.riderId
  await publishEvent(other, "chat.message", { tripId: trip.id, message })
  return successResponse(message, 201)
})
