import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import * as relayChatService from "@/lib/services/trip/relay-chat-service"
import { tripMessageSchema } from "@/lib/validation/trip/trip-schema"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const messages = await relayChatService.listRelayMessages(getUserId(request), id)
  return successResponse(messages)
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = tripMessageSchema.parse(await parseJsonBody(request))
  const message = await relayChatService.sendRelayMessage(getUserId(request), id, input)
  return successResponse(message, 201)
})
