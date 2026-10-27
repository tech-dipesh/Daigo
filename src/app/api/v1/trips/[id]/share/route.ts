import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseOptionalJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import * as shareService from "@/lib/services/share-service"
import { shareSchema } from "@/lib/validation/trip-schema"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = shareSchema.parse(await parseOptionalJsonBody(request))
  const result = await shareService.shareTrip(getUserId(request), id, input)
  return successResponse(result)
})

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await shareService.stopSharing(getUserId(request), id)
  return successResponse(result)
})
