import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import * as tripService from "@/lib/services/trip-service"
import type { RouteParams } from "@/types/api"
import { verifyPickupSchema } from "@/lib/validation/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = verifyPickupSchema.parse(await parseJsonBody(request))
  const result = await tripService.verifyPickup(getUserId(request), id, input)
  return successResponse(result)
})
