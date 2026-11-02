import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as requestService from "@/lib/services/ride/request-service"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const entry = await requestService.joinWaitlist(getUserId(request), id)
  return successResponse(entry, 201)
})

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await requestService.leaveWaitlist(getUserId(request), id)
  return successResponse(result)
})
