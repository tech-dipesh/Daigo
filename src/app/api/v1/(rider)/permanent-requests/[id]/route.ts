import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as permanentService from "@/lib/services/ride/permanent-service"

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await permanentService.cancelPermanent(getUserId(request), id)
  return successResponse(result)
})
