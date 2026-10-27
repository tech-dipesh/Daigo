import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as savedRouteService from "@/lib/services/saved-route-service"
import type { RouteParams } from "@/types/api"

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await savedRouteService.removeSaved(getUserId(request), id)
  return successResponse(result)
})
