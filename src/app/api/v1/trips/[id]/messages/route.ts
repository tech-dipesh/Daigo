import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as chatService from "@/lib/services/chat-service"
import { tripMessageSchema } from "@/lib/validation/trip-schema"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const messages = await chatService.listMessages(getUserId(request), id)
  return successResponse(messages)
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = tripMessageSchema.parse(await parseJsonBody(request))
  const message = await chatService.sendMessage(getUserId(request), id, input)
  return successResponse(message, 201)
})
