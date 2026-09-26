import { compare } from "bcrypt"
import { db } from "@/lib/infra/db"
import { verifyRefreshToken, issueTokenPair } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { setAuthCookies } from "@/lib/infra/cookies"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

export const POST = withErrorHandling(async (request) => {
  const refreshTokenCookie = request.cookies.get("refresh_token")?.value

  if (!refreshTokenCookie) {
    throw new AppError("No refresh token provided", 401)
  }

  const payload = await verifyRefreshToken(refreshTokenCookie)

  if (!payload) {
    throw new AppError("Invalid or expired refresh token", 401)
  }

  const storedTokens = await db.refreshToken.findMany({
    where: { userId: payload.userId, revokedAt: null },
  })

  let matchedTokenId: string | null = null

  for (const storedToken of storedTokens) {
    if (await compare(refreshTokenCookie, storedToken.tokenHash)) {
      matchedTokenId = storedToken.id
      break
    }
  }

  if (!matchedTokenId) {
    throw new AppError("Refresh token not recognized", 401)
  }

  await db.refreshToken.update({
    where: { id: matchedTokenId },
    data: { revokedAt: new Date() },
  })

  const { accessToken, refreshToken } = await issueTokenPair(payload.userId)

  const response = successResponse(null, 200)

  return setAuthCookies(response, accessToken, refreshToken)
})
