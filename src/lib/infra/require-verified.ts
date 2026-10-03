import { db } from "@/lib/infra/db"
import { AppError } from "@/lib/infra/response"

export async function requireVerifiedEmail(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { emailVerifiedAt: true } })
  if (!user.emailVerifiedAt) {
    throw new AppError("Please verify your email before doing this", 403)
  }
}
