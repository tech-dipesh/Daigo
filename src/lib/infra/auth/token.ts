import { createHash } from "node:crypto"
import { SignJWT, jwtVerify } from "jose"
import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { env } from "@/lib/infra/clients/env"

const tokenPayloadSchema = z.object({
  userId: z.string(),
})

type TokenPayload = z.infer<typeof tokenPayloadSchema>
type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

const accessTokenSecret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET)
const refreshTokenSecret = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET)
const refreshTokenLifetimeMs = 1000 * 60 * 60 * 24 * 30

/*
  refresh tokens are stored as sha256, not bcrypt
  bcrypt only reads the first 72 bytes so every jwt of one user looked the same to it
*/
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")

async function signToken(payload: TokenPayload, secret: Uint8Array, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

async function verifyToken(token: string, secret: Uint8Array): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const parsedPayload = tokenPayloadSchema.safeParse(payload)
    return parsedPayload.success ? parsedPayload.data : null
  } catch {
    return null
  }
}

export function signAccessToken(payload: TokenPayload) {
  return signToken(payload, accessTokenSecret, "15m")
}

export function signRefreshToken(payload: TokenPayload) {
  return signToken(payload, refreshTokenSecret, "30d")
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, accessTokenSecret)
}

export function verifyRefreshToken(token: string) {
  return verifyToken(token, refreshTokenSecret)
}

export async function issueTokenPair(userId: string, client: TransactionClient | typeof db = db) {
  const accessToken = await signAccessToken({ userId })
  const refreshToken = await signRefreshToken({ userId })
  await client.refreshToken.create({
    data: { userId, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + refreshTokenLifetimeMs) },
  })
  return { accessToken, refreshToken }
}

export async function rotateRefreshToken(refreshTokenCookie: string) {
  const payload = await verifyRefreshToken(refreshTokenCookie)
  if (!payload) return null
  const stored = await db.refreshToken.findFirst({ where: { userId: payload.userId, tokenHash: sha256(refreshTokenCookie), revokedAt: null } })
  if (!stored || stored.expiresAt < new Date()) return null
  const tokens = await db.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({ where: { id: stored.id, revokedAt: null }, data: { revokedAt: new Date() } })
    if (!revoked.count) return null
    return issueTokenPair(payload.userId, tx)
  })
  return tokens ? { ...tokens, userId: payload.userId } : null
}
