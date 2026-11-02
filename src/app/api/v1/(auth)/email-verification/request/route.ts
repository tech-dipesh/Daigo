import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as emailVerificationService from "@/lib/services/account/email-verification-service"

export const POST = withErrorHandling(async (request) => {
  const result = await emailVerificationService.requestEmailVerification(getUserId(request))
  return successResponse(result)
})
