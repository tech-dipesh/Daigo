import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"

export async function requireVerifiedEmail(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { emailVerifiedAt: true } })
  if (!user.emailVerifiedAt) {
    throw new AppError("Please verify your email before doing this", 403)
  }
}

export async function requireMember(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { emailVerifiedAt: true, staffRole: true, isBanned: true, deletedAt: true },
  })
  if (user.deletedAt) throw new AppError("This account was deleted", 403)
  if (user.staffRole) throw new AppError("Staff accounts cannot use rider or driver features", 403)
  if (user.isBanned) throw new AppError("Your account is banned, you can appeal it", 403)
  if (!user.emailVerifiedAt) throw new AppError("Please verify your email before doing this", 403)
}
