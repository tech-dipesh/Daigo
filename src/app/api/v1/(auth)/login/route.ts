import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as authService from "@/lib/services/auth-service"
import { loginSchema } from "@/lib/validation/auth-schema"

export const POST = withErrorHandling(async (request) => {
  const input = loginSchema.parse(await parseJsonBody(request))
  const result = await authService.login(input)
  if (result.requiresCode) return successResponse({ requiresCode: true, challengeId: result.challengeId })
  return setAuthCookies(successResponse(result.user, 200), result.tokens.accessToken, result.tokens.refreshToken)
})