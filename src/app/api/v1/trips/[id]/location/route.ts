import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as locationService from "@/lib/services/trip/location-service"
import { locationSchema } from "@/lib/validation/trip/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = locationSchema.parse(await parseJsonBody(request))
  const location = await locationService.postLocation(getUserId(request), id, input)
  return successResponse(location)
})

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const location = await locationService.getLocation(getUserId(request), id)
  return successResponse(location)
})
