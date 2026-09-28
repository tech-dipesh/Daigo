import { SignJWT, jwtVerify } from "jose"
import { hash, compare } from "bcrypt"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError } from "@/lib/infra/response"

const tokenPayloadSchema = z.object({
  userId: z.string(),
})

type TokenPayload = z.infer<typeof tokenPayloadSchema>
type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

const accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
const refreshTokenSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET)
const refreshTokenLifetimeMs = 1000 * 60 * 60 * 24 * 30

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
    data: {
      userId,
      tokenHash: await hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
    },
  })

  return { accessToken, refreshToken }
}

export async function rotateRefreshToken(refreshTokenCookie: string) {
  const payload = await verifyRefreshToken(refreshTokenCookie)

  if (!payload) {
    return null
  }

  const storedTokens = await db.refreshToken.findMany({
    where: { userId: payload.userId, revokedAt: null },
  })

  let matchedTokenId: string | null = null

  for (const storedToken of storedTokens) {
    if (await compare(refreshTokenCookie, storedToken.tokenHash)) {
      matchedTokenId = storedToken.id
      break
    }
  }

  if (!matchedTokenId) {
    return null
  }

  const tokens = await db.$transaction(async (tx) => {
    await tx.refreshToken.update({ where: { id: matchedTokenId }, data: { revokedAt: new Date() } })
    return issueTokenPair(payload.userId, tx)
  })

  return { ...tokens, userId: payload.userId }
}

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get("x-user-id")

  if (!userId) {
    throw new AppError("Not authenticated", 401)
  }

  return userId
}
