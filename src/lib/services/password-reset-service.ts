import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { hashPassword } from "@/lib/infra/auth/password"
import { consumeVerificationToken, issueVerificationToken } from "@/lib/infra/auth/verification-token"
import * as userRepo from "@/lib/repository/user-repo"
import type { PasswordResetConfirmInput, PasswordResetRequestInput } from "@/lib/validation/auth-schema"
import { enforceLimit } from "@/lib/infra/clients/action-limit"

const resetLifetimeMs = 1000 * 60 * 60

export async function requestPasswordReset({ email }: PasswordResetRequestInput) {
  await enforceLimit("reset", email.toLowerCase())
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new AppError("The Email is not registered please register first", 401)
  }
  const token = await issueVerificationToken(user.id, "PASSWORD_RESET", resetLifetimeMs)
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
  return { message: "If that email is registered, a reset code has been sent." }
}

/*
  reset will always kill a existing session
  with also drop our prev old
*/
// a reset should kill every existing session, not just stop future logins with the old password
export async function confirmPasswordReset({ token, newPassword }: PasswordResetConfirmInput) {
  const userId = await consumeVerificationToken(token, "PASSWORD_RESET")
  if (!userId) {
    throw new AppError("This reset code is invalid or has expired", 400)
  }
  const passwordHash = await hashPassword(newPassword)
  await userRepo.resetPassword(userId, passwordHash)
  return { message: "Password updated. Please log in again." }
}
