import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as authService from "@/lib/services/auth-service"
import { loginVerifySchema } from "@/lib/validation/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = loginVerifySchema.parse(await parseJsonBody(request))
  const { user, tokens } = await authService.verifyAdminLogin(input)
  return setAuthCookies(successResponse(user, 200), tokens.accessToken, tokens.refreshToken)
})
