import { hash } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { issueTokenPair } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { issueVerificationToken } from "@/lib/infra/auth/verification-token"
import { env } from "@/lib/infra/clients/env"

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})
const emailVerificationLifetimeMs = 1000 * 60 * 60 * 24
export const POST = withErrorHandling(async (request) => {
  const body = await parseJsonBody(request)
  const { email, password } = signupSchema.parse(body)
  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409)
  }
  const passwordHash = await hash(password, 12)
  const user = await db.user.create({ data: { email, passwordHash } })
  const { accessToken, refreshToken } = await issueTokenPair(user.id)
  const verificationToken = await issueVerificationToken(
    user.id,
    "EMAIL_VERIFICATION",
    emailVerificationLifetimeMs,
  )
  const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${verificationToken}`
  await sendEmailBestEffort({
    to: user.email,
    subject: "Verify your DaiGo email",
    text: `Welcome to DaiGo. Click here to verify: ${verifyLink}\n\nOr use this code: ${verificationToken}\n\nThis expires in 24 hours.`,
  })
  const response = successResponse({ userId: user.id, email: user.email }, 201)
  return setAuthCookies(response, accessToken, refreshToken)
})
