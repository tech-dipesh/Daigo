import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as authService from "@/lib/services/account/auth-service"
import { loginSchema } from "@/lib/validation/account/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = loginSchema.parse(await parseJsonBody(request))
  const result = await authService.login(input)
  if (result.requiresCode) return successResponse({ requiresCode: true, challengeId: result.challengeId }, 200)
  const { user, tokens } = result
  return setAuthCookies(successResponse(user, 200), tokens.accessToken, tokens.refreshToken)
})