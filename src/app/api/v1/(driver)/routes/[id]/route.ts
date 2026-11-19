import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as routeStatusService from "@/lib/services/driver/route-status-service"
import { routeStatusSchema } from "@/lib/validation/driver/route-status-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = routeStatusSchema.parse(await parseJsonBody(request))
  const route = await routeStatusService.setRouteStatus(getUserId(request), id, input)
  return successResponse(route)
})
