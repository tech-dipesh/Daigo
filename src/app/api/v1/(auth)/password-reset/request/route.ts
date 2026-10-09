import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { sendEmailBestEffort } from "@/lib/infra/email"
import { issueVerificationToken } from "@/lib/infra/verification-token"
import { env } from "@/lib/infra/env"

const requestSchema = z.object({
  email: z.email(),
})
const tokenLifetimeMs = 1000 * 60 * 60

export const POST = withErrorHandling(async (request) => {
  const { email } = requestSchema.parse(await parseJsonBody(request))
  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError("The Email is not registered please register first", 401) 
  }
  if (user) {
    const token = await issueVerificationToken(user.id, "PASSWORD_RESET", tokenLifetimeMs)
    /*
      it's have to be on the frontend form with a new password,
      can't do on the get link
       */
    const resetLink = `${env.APP_URL}/reset-password?token=${token}`
    await sendEmailBestEffort({
      to: user.email,
      subject: "Reset your DaiGo password",
      text: `Click here to reset your password: ${resetLink}\n\nOr use this code: ${token}\n\nThis expires in 1 hour.`,
    })
  }
  return successResponse({ message: "If that email is registered, a reset code has been sent." })
})
