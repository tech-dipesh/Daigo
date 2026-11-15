import { clearAuthCookies } from "@/lib/infra/auth/cookies"
import { revokeRefreshToken } from "@/lib/infra/auth/token"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const POST = withErrorHandling(async (request) => {
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value
  if (refreshTokenCookie) await revokeRefreshToken(refreshTokenCookie)
  return clearAuthCookies(successResponse({ loggedOut: true }))
})
