import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import * as tripService from "@/lib/services/trip/trip-service"
import type { RouteParams } from "@/types/api"
import { cancelSchema } from "@/lib/validation/trip/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = cancelSchema.parse(await parseJsonBody(request))
  const result = await tripService.cancelTrip(getUserId(request), id, input)
  return successResponse(result)
})
