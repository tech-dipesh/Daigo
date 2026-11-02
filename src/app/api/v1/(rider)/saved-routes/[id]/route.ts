import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { withIdempotency } from "@/lib/infra/http/idempotency"
import { parseOptionalJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import * as savedRouteService from "@/lib/services/ride/saved-route-service"
import type { RouteParams } from "@/types/api"
import { oneTapSchema } from "@/lib/validation/ride/saved-route-schema"

export const POST = withErrorHandling<RouteParams>(withIdempotency(async (request, { params }) => {
  const id = await idFrom(params)
  const input = oneTapSchema.parse(await parseOptionalJsonBody(request))
  const rideRequest = await savedRouteService.requestFromSaved(getUserId(request), id, input)
  return successResponse(rideRequest, 201)
}))
