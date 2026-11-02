import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as emailVerificationService from "@/lib/services/account/email-verification-service"
import { emailCodeSchema } from "@/lib/validation/account/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = emailCodeSchema.parse(await parseJsonBody(request))
  const user = await emailVerificationService.verifyEmailCode(getUserId(request), input)
  return successResponse(user)
})
