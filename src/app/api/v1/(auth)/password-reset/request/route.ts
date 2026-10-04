import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { sendEmailBestEffort } from "@/lib/infra/email"
import { issueVerificationToken } from "@/lib/infra/verification-token"

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

    await sendEmailBestEffort({
      to: user.email,
      subject: "Reset your DaiGo password",
      text: `Use this code to reset your password: ${token}\n\nThis code expires in 1 hour.`,
    })
  }

  return successResponse({ message: "A reset code has been sent to your mail." })
})

/*
  send the mail for the user about reset a code with send a random token to verify it
  where the token has is inserted of the request.
*/