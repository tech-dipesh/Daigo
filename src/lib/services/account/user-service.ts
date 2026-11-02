import { AppError } from "@/lib/infra/http/response"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { verifyPassword } from "@/lib/infra/auth/password"
import { issueVerificationToken } from "@/lib/infra/auth/verification-token"
import { getWarningSummary } from "@/lib/infra/economy/warnings"
import * as tripRepo from "@/lib/repository/trip/trip-repo"
import * as userRepo from "@/lib/repository/account/user-repo"
import type { AccountDeleteInput, MePatchInput } from "@/lib/validation/account/user-schema"

import { coinsRequiredToRedeem, redemptionDiscountRupees } from "@/lib/infra/economy/coins"
const emailLifetimeMs = 1000 * 60 * 60 * 24

export async function getMe(userId: string) {
  const user = await userRepo.profile(userId)
  if (!user) {
    throw new AppError("User not found", 404)
  }
  const warnings = await getWarningSummary(userId)
  return { ...user, warnings }
}

export async function updateMe(userId: string, { role, name, email, language, currentPassword }: MePatchInput) {
  const current = await userRepo.getById(userId)
  if (role && current.staffRole) throw new AppError("Staff accounts cannot switch rider or driver mode", 403)
  const newEmail = email && email !== current.email ? email : undefined
  if (newEmail) {
    const ok = currentPassword ? await verifyPassword(currentPassword, current.passwordHash) : false
    if (!ok) throw new AppError("Enter your current password to change email", 403)
  }
  const user = await userRepo.updateProfile(userId, { activeRole: role, name, language, email: newEmail, emailVerifiedAt: newEmail ? null : undefined })
  if (newEmail) {
    const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION", emailLifetimeMs)
    const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${token}`
    await sendEmailBestEffort({ to: newEmail, subject: "Verify your new DaiGo email", text: `Click here to verify: ${verifyLink}\n\nThis expires in 24 hours.` })
  }
  return user
}

export async function getCoinStatus(userId: string) {
  const user = await userRepo.getById(userId)
  const eligible = user.coinBalance >= coinsRequiredToRedeem
  return {
    coinBalance: user.coinBalance,
    eligibleForDiscount: eligible,
    discountRupees: eligible ? redemptionDiscountRupees : 0,
    coinsNeeded: eligible ? 0 : coinsRequiredToRedeem - user.coinBalance,
  }
}

export async function deleteMe(userId: string, { currentPassword }: AccountDeleteInput) {
  const user = await userRepo.getById(userId)
  if (user.staffRole) throw new AppError("Staff accounts can't be deleted here", 403)
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new AppError("Wrong password", 403)
  if (await tripRepo.hasActiveTrip(userId)) throw new AppError("Finish or cancel your active trip first", 409)
  await userRepo.softDelete(userId)
  return { deleted: true }
}
