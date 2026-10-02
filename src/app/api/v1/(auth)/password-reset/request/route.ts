import { randomBytes, createHash } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { sendEmailBestEffort } from "@/lib/infra/email"

const requestSchema = z.object({
  email: z.email(),
})

const tokenLifetimeMs = 1000 * 60 * 60

export const POST = withErrorHandling(async (request) => {
  const { email } = requestSchema.parse(await parseJsonBody(request))

  const user = await db.user.findUnique({ where: { email } })

  if (user) {
    const token = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(token).digest("hex")

    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + tokenLifetimeMs) },
    })

    await sendEmailBestEffort({
      to: user.email,
      subject: "Reset your DaiGo password",
      text: `Use this code to reset your password: ${token}\n\nThis code expires in 1 hour.`,
    })
  }

  return successResponse({ message: "If that email is registered, a reset code has been sent." })
})

/*
  send the mail for the user about reset a code with send a random token to verify it
  where the token has is inserted of the request.
*/