import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as passwordResetService from "@/lib/services/password-reset-service"
import { passwordResetConfirmSchema } from "@/lib/validation/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = passwordResetConfirmSchema.parse(await parseJsonBody(request))
  const result = await passwordResetService.confirmPasswordReset(input)
  return successResponse(result)
})
