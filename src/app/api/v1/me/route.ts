import { compare } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { issueVerificationToken } from "@/lib/infra/auth/verification-token"
import { env } from "@/lib/infra/clients/env"
import { getWarningSummary } from "@/lib/infra/economy/warnings"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, activeRole: true, trustScore: true, isBanned: true, createdAt: true },
  })
  if (!user) {
    throw new AppError("User not found", 404)
  }
  const warnings = await getWarningSummary(userId)
  return successResponse({ ...user, warnings })
})
const emailLifetimeMs = 1000 * 60 * 60 * 24
const patchSchema = z
  .object({
    role: z.enum(["RIDER", "DRIVER"]).optional(),
    name: z.string().min(3).max(15).optional(),
    email: z.email().optional(),
    currentPassword: z.string().optional(),
  })
  .refine((b) => b.role || b.name || b.email, { message: "Send at least one field to update" })

export const PATCH = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const body = await parseJsonBody(request)
  const { role, name, email, currentPassword } = patchSchema.parse(body)
  const current = await db.user.findUniqueOrThrow({ where: { id: userId } })
  if (role && current.staffRole) throw new AppError("Staff accounts cannot switch rider or driver mode", 403)
  const newEmail = email && email !== current.email ? email : undefined
  if (newEmail) {
    const ok = currentPassword ? await compare(currentPassword, current.passwordHash) : false
    if (!ok) throw new AppError("Enter your current password to change email", 403)
  }
  const user = await db.user.update({
    where: { id: userId },
    data: { activeRole: role, name, email: newEmail, emailVerifiedAt: newEmail ? null : undefined },
    select: { id: true, email: true, name: true, activeRole: true },
  })
  if (newEmail) {
    const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION", emailLifetimeMs)
    const verifyLink = `${env.APP_URL}/api/v1/email-verification/confirm?token=${token}`
    await sendEmailBestEffort({ to: newEmail, subject: "Verify your new DaiGo email", text: `Click here to verify: ${verifyLink}\n\nThis expires in 24 hours.` })
  }
  return successResponse(user)
})
