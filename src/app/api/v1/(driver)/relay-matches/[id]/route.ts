import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as matchInboxService from "@/lib/services/ride/match-inbox-service"
import * as matchService from "@/lib/services/ride/match-service"
import { relayDecisionSchema } from "@/lib/validation/ride/match-schema"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const relay = await matchInboxService.getRelay(getUserId(request), id)
  return successResponse(relay)
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = relayDecisionSchema.parse(await parseJsonBody(request))
  const result = await matchService.decideRelay(getUserId(request), id, input)
  return successResponse(result)
})
