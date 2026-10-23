import { createHmac, randomInt, timingSafeEqual } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { env } from "@/lib/infra/clients/env"

type Purpose = "EMAIL_VERIFY" | "ADMIN_LOGIN"

export const otpMinutes = 10
const maxAttempts = 5
const hashOf = (code: string, userId: string) => createHmac("sha256", env.ACCESS_TOKEN_SECRET).update(`${userId}:${code}`).digest("hex")

/*
  The has is storing
  the unused will die on the when new one is issue
*/
export async function issueOtp(userId: string, purpose: Purpose) {
  const code = randomInt(100000, 1000000).toString()
  await db.otpCode.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } })
  const row = await db.otpCode.create({ data: { userId, purpose, codeHash: hashOf(code, userId), expiresAt: new Date(Date.now() + otpMinutes * 60 * 1000) } })
  return { code, id: row.id }
}

export async function verifyOtp(userId: string, purpose: Purpose, code: string, id?: string) {
  const row = await db.otpCode.findFirst({ where: { userId, purpose, usedAt: null, ...(id ? { id } : {}) }, orderBy: { createdAt: "desc" } })
  if (!row || row.expiresAt < new Date() || row.attempts >= maxAttempts) return false
  const same = timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(hashOf(code, userId)))
  if (!same) {
    await db.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
    return false
  }
  const used = await db.otpCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })
  return used.count === 1
}
