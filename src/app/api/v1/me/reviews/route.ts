import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as reviewService from "@/lib/services/account/review-service"

export const GET = withErrorHandling(async (request) => {
  const reviews = await reviewService.myReviews(getUserId(request))
  return successResponse(reviews)
})
