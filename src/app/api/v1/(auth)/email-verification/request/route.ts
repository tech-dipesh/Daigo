import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { sendEmailBestEffort } from "@/lib/infra/email"
import { issueVerificationToken } from "@/lib/infra/verification-token"
import { env } from "@/lib/infra/env"

const tokenLifetimeMs = 1000 * 60 * 60 * 24

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  if (user.emailVerifiedAt) {
    throw new AppError("This email is already verified", 409)
  }
  const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION", tokenLifetimeMs)
  const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${token}`
  await sendEmailBestEffort({
    to: user.email,
    subject: "Verify your DaiGo email",
    text: `Click here to verify: ${verifyLink}\n\nOr use this code: ${token}\n\nThis expires in 24 hours.`,
  })
  return successResponse({ message: "Verification code sent." })
})
