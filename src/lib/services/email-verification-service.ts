import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { issueOtp, otpMinutes, verifyOtp } from "@/lib/infra/auth/otp"
import { consumeVerificationToken, issueVerificationToken } from "@/lib/infra/auth/verification-token"
import * as userRepo from "@/lib/repository/user-repo"
import type { EmailCodeInput, EmailConfirmInput } from "@/lib/validation/auth-schema"
import { enforceLimit } from "@/lib/infra/clients/action-limit"

const dayMs = 1000 * 60 * 60 * 24

export async function requestEmailVerification(userId: string) {
  const user = await userRepo.getById(userId)
  if (user.emailVerifiedAt) {
    throw new AppError("This email is already verified", 409)
  }
  const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION", dayMs)
  const { code } = await issueOtp(userId, "EMAIL_VERIFY")
  const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${token}`
  await sendEmailBestEffort({
    to: user.email,
    subject: "Verify your DaiGo email",
    text: `Click here to verify: ${verifyLink}\n\nOr use this 6 digit code within ${otpMinutes} minutes: ${code}\n\nThe link expires in 24 hours.`,
  })
  return { message: "Verification code sent." }
}

/* the clickable email link, false means bad or expired token */
export async function verifyEmailLink(token: string) {
  const userId = await consumeVerificationToken(token, "EMAIL_VERIFICATION")
  if (!userId) return false
  await userRepo.verifyEmail(userId)
  return true
}

export async function verifyEmailToken({ token }: EmailConfirmInput) {
  const userId = await consumeVerificationToken(token, "EMAIL_VERIFICATION")
  if (!userId) throw new AppError("This verification code is invalid or has expired", 400)
  return userRepo.verifyEmail(userId)
}

export async function verifyEmailCode(userId: string, { code }: EmailCodeInput) {
  await enforceLimit("code", userId)
  const ok = await verifyOtp(userId, "EMAIL_VERIFY", code)
  if (!ok) throw new AppError("Invalid or expired code", 400)
  return userRepo.verifyEmail(userId)
}
