import { AppError, successResponse } from "@/lib/infra/response"
import { setAuthCookies } from "@/lib/infra/cookies"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { rotateRefreshToken } from "@/lib/infra/auth"

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
