import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as ratingService from "@/lib/services/rating-service"
import { ratingSchema } from "@/lib/validation/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = ratingSchema.parse(await parseJsonBody(request))
  const result = await ratingService.rateTrip(getUserId(request), id, input)
  return successResponse(result, 201)
})
