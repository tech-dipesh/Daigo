import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as driverService from "@/lib/services/driver/driver-service"
import { autoAcceptSchema } from "@/lib/validation/ride/match-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = autoAcceptSchema.parse(await parseJsonBody(request))
  const route = await driverService.setAutoAccept(getUserId(request), id, input)
  return successResponse(route)
})
