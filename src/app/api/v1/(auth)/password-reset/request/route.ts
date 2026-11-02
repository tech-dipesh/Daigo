import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as passwordResetService from "@/lib/services/account/password-reset-service"
import { passwordResetRequestSchema } from "@/lib/validation/account/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = passwordResetRequestSchema.parse(await parseJsonBody(request))
  const result = await passwordResetService.requestPasswordReset(input)
  return successResponse(result)
})
