import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { issueOtp, otpMinutes, verifyOtp } from "@/lib/infra/auth/otp"
import { hashPassword, verifyPassword } from "@/lib/infra/auth/password"
import { issueTokenPair } from "@/lib/infra/auth/token"
import { issueVerificationToken } from "@/lib/infra/auth/verification-token"
import * as otpRepo from "@/lib/repository/otp-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { LoginInput, LoginVerifyInput, SignupInput } from "@/lib/validation/auth-schema"
import { enforceLimit } from "@/lib/infra/clients/action-limit"

const dayMs = 1000 * 60 * 60 * 24

export async function signup({ email, password }: SignupInput) {
  const existingUser = await userRepo.findByEmail(email)
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409)
  }
  const passwordHash = await hashPassword(password)
  const user = await userRepo.createUser(email, passwordHash)
  const tokens = await issueTokenPair(user.id)
  const verificationToken = await issueVerificationToken(user.id, "EMAIL_VERIFICATION", dayMs)
  const { code } = await issueOtp(user.id, "EMAIL_VERIFY")
  const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${verificationToken}`
  await sendEmailBestEffort({
    to: user.email,
    subject: "Verify your DaiGo email",
    text: `Welcome to DaiGo. Click here to verify: ${verifyLink}\n\nOr use this 6 digit code within ${otpMinutes} minutes: ${code}\n\nThe link expires in 24 hours.`,
  })
  return { user: { userId: user.id, email: user.email }, tokens }
}

export async function login({ email, password }: LoginInput) {
  await enforceLimit("login", email.toLowerCase())
  const user = await userRepo.findByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401)
  }
  if (user.staffRole === "SUPER_ADMIN") {
    const { code, id } = await issueOtp(user.id, "ADMIN_LOGIN")
    await sendEmailBestEffort({ to: user.email, subject: "Your DaiGo admin login code", text: `Your login code is ${code}. It expires in ${otpMinutes} minutes.` })
    return { requiresCode: true as const, challengeId: id }
  }
  const tokens = await issueTokenPair(user.id)
  return { requiresCode: false as const, user: { userId: user.id, email: user.email }, tokens }
}

export async function verifyAdminLogin({ challengeId, code }: LoginVerifyInput) {
  await enforceLimit("code", challengeId)
  const row = await otpRepo.findById(challengeId)
  const ok = row && row.purpose === "ADMIN_LOGIN" ? await verifyOtp(row.userId, "ADMIN_LOGIN", code, challengeId) : false
  if (!row || !ok) throw new AppError("Invalid or expired code", 401)
  const user = await userRepo.getById(row.userId)
  const tokens = await issueTokenPair(user.id)
  return { user: { userId: user.id, email: user.email }, tokens }
}
