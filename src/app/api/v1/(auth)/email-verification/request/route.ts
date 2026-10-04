import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { sendEmailBestEffort } from "@/lib/infra/email"
import { issueVerificationToken } from "@/lib/infra/verification-token"

const tokenLifetimeMs = 1000 * 60 * 60 * 24

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })

  if (user.emailVerifiedAt) {
    throw new AppError("This email is already verified", 409)
  }

  const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION", tokenLifetimeMs)
  await sendEmailBestEffort({
    to: user.email,
    subject: "Verify your DaiGo email",
    text: `Use this code to verify your email: ${token}\n\nThis code expires in 24 hours.`,
  })

  return successResponse({ message: "Verification Code Have Been Sent to your Mail." })
})
