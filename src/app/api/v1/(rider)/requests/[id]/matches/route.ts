import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as matchingService from "@/lib/services/matching-service"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const matches = await matchingService.findMatches(getUserId(request), id)
  return successResponse(matches)
})
