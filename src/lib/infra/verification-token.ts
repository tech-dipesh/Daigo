import { randomBytes, createHash } from "node:crypto"
import { db } from "@/lib/infra/db"

type Purpose = "PASSWORD_RESET" | "EMAIL_VERIFICATION"

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export async function issueVerificationToken(userId: string, purpose: Purpose, lifetimeMs: number) {
  const token = randomBytes(32).toString("hex")

  await db.verificationToken.create({
    data: { userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + lifetimeMs) },
  })

  return token
}

export async function consumeVerificationToken(token: string, purpose: Purpose) {
  const record = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } })

  if (!record || record.purpose !== purpose || record.usedAt || record.expiresAt < new Date()) {
    return null
  }

  await db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })

  return record.userId
}

/*
  Plain sha with no bcrypt 
  also i've implement a direct hash lookup
  for stateful store on the db
*/