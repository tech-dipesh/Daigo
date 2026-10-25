import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as requestService from "@/lib/services/request-service"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const fresh = await requestService.retryRequest(getUserId(request), id)
  return successResponse(fresh, 201)
})
