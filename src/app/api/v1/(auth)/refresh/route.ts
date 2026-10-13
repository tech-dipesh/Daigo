import { AppError, successResponse } from "@/lib/infra/http/response"
import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { rotateRefreshToken } from "@/lib/infra/auth/auth"

export const POST = withErrorHandling(async (request) => {
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value
  if (!refreshTokenCookie) {
    throw new AppError("No refresh token provided", 401)
  }
  const rotated = await rotateRefreshToken(refreshTokenCookie)
  if (!rotated) {
    throw new AppError("Invalid or expired refresh token", 401)
  }
  const response = successResponse(null, 200)
  return setAuthCookies(response, rotated.accessToken, rotated.refreshToken)
})
