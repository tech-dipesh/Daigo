import {  jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { AppError } from "@/lib/infra/errors"

const tokenPayloadSchema = z.object({
  userId: z.string(),
})

type TokenPayload = z.infer<typeof tokenPayloadSchema>

const accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
async function verifyToken(token: string, secret: Uint8Array): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const parsedPayload = tokenPayloadSchema.safeParse(payload)
    return parsedPayload.success ? parsedPayload.data : null
  } catch {
    return null
  }
}
export function verifyAccessToken(token: string) {
  return verifyToken(token, accessTokenSecret)
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
