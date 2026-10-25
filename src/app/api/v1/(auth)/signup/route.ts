import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as authService from "@/lib/services/auth-service"
import { signupSchema } from "@/lib/validation/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = signupSchema.parse(await parseJsonBody(request))
  const { user, tokens } = await authService.signup(input)
  return setAuthCookies(successResponse(user, 201), tokens.accessToken, tokens.refreshToken)
})
