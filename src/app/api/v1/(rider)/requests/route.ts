import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as requestService from "@/lib/services/request-service"
import { rideRequestSchema } from "@/lib/validation/request-schema"

export const POST = withErrorHandling(async (request) => {
  const input = rideRequestSchema.parse(await parseJsonBody(request))
  const rideRequest = await requestService.createRequest(getUserId(request), input)
  return successResponse(rideRequest, 201)
})

export const GET = withErrorHandling(async (request) => {
  const requests = await requestService.listRequests(getUserId(request))
  return successResponse(requests)
})
