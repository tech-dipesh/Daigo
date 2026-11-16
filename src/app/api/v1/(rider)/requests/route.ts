import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { withIdempotency } from "@/lib/infra/http/idempotency"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as requestService from "@/lib/services/ride/request-service"
import { rideRequestSchema } from "@/lib/validation/ride/request-schema"

export const GET = withErrorHandling(async (request) => {
  const requests = await requestService.listRequests(getUserId(request))
  return successResponse(requests)
})

export const POST = withErrorHandling(withIdempotency(async (request) => {
  const input = rideRequestSchema.parse(await parseJsonBody(request))
  const created = await requestService.createRequest(getUserId(request), input)
  return successResponse(created, 201)
}))
