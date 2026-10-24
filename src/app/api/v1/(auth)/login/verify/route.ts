import { db } from "@/lib/infra/clients/db"
import { issueTokenPair } from "@/lib/infra/auth/token"
import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { verifyOtp } from "@/lib/infra/auth/otp"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { loginVerifySchema } from "@/lib/validation/auth-schema"
import * as userRepo from "@/lib/repository/user-repo"

export const POST = withErrorHandling(async (request) => {
  const { challengeId, code } = loginVerifySchema.parse(await parseJsonBody(request))
  const row = await db.otpCode.findUnique({ where: { id: challengeId } })
  const ok = row && row.purpose === "ADMIN_LOGIN" ? await verifyOtp(row.userId, "ADMIN_LOGIN", code, challengeId) : false
  if (!row || !ok) throw new AppError("Invalid or expired code", 401)
  const user = await userRepo.getById(row.userId)
  const { accessToken, refreshToken } = await issueTokenPair(user.id)
  const response = successResponse({ userId: user.id, email: user.email }, 200)
  return setAuthCookies(response, accessToken, refreshToken)
})
