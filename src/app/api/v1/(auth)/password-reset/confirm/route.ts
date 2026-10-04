import { hash } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { consumeVerificationToken } from "@/lib/infra/verification-token"
const confirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})
export const POST = withErrorHandling(async (request) => {
  const { token, newPassword } = confirmSchema.parse(await parseJsonBody(request))
  const userId = await consumeVerificationToken(token, "PASSWORD_RESET")
  if (!userId) {
    throw new AppError("This reset code is invalid or has expired", 400)
  }
  const passwordHash = await hash(newPassword, 12)
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } })
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  })
  return successResponse({ message: "Password updated. Please log in again." })
})
/*
  reset will always kill a existing session
  with also drop our prev old 
*/
// a reset should kill every existing session, not just stop future logins with the old password