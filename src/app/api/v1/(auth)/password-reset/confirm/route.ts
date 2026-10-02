import { createHash } from "node:crypto"
import { hash } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"

const confirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export const POST = withErrorHandling(async (request) => {
  const { token, newPassword } = confirmSchema.parse(await parseJsonBody(request))
  const tokenHash = createHash("sha256").update(token).digest("hex")

  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError("This reset code is invalid or has expired", 400)
  }

  const passwordHash = await hash(newPassword, 12)

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } })
    await tx.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } })

    await tx.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  })

  return successResponse({ message: "Password updated. Please log in again." })
})

/*
  all the session will kill when session done.
  with future login move to new password session
  i will also make a side effect this later on
*/
