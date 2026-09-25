import { SignJWT, jwtVerify } from "jose"
import { hash } from "bcrypt"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { AppError } from "@/lib/infra/errors"

const tokenPayloadSchema = z.object({
  userId: z.string(),
})

type TokenPayload = z.infer<typeof tokenPayloadSchema>

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

export async function issueTokenPair(userId: string) {
  const accessToken = await signAccessToken({ userId })
  const refreshToken = await signRefreshToken({ userId })

  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: await hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
    },
  })

  return { accessToken, refreshToken }
}

export async function requireUserId(request: NextRequest): Promise<string> {
  const accessTokenCookie = request.cookies.get("access_token")?.value

  if (!accessTokenCookie) {
    throw new AppError("Not authenticated", 401)
  }

  const payload = await verifyAccessToken(accessTokenCookie)

  if (!payload) {
    throw new AppError("Not authenticated", 401)
  }

  return payload.userId
}
