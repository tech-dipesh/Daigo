import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as matchService from "@/lib/services/match-service"
import { matchDecisionSchema } from "@/lib/validation/match-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = matchDecisionSchema.parse(await parseJsonBody(request))
  const match = await matchService.decideMatch(getUserId(request), id, input)
  return successResponse(match)
})
