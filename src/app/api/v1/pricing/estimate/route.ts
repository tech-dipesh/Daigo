import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as requestService from "@/lib/services/request-service"
import { priceEstimateQuerySchema } from "@/lib/validation/request-schema"

export const GET = withErrorHandling(async (request) => {
  const input = priceEstimateQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const estimate = await requestService.priceEstimate(input)
  return successResponse(estimate)
})
