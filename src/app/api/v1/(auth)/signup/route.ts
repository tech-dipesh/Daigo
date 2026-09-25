import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { issueTokenPair } from "@/lib/infra/auth"
import { AppError, errorResponse } from "@/lib/infra/errors"
import { setAuthCookies } from "@/lib/infra/cookies"

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = signupSchema.parse(body)

    const exist = await db.user.findUnique({ where: { email } })

    if (exist) {
      throw new AppError("An account with this email already exists", 409)
    }

    const passwordHash = await hash(password, 12)
    const user = await db.user.create({ data: { email, passwordHash } })

    const { accessToken, refreshToken } = await issueTokenPair(user.id)

    const response = NextResponse.json(
      { success: true, data: { userId: user.id, email: user.email }, error: null },
      { status: 201 },
    )

    return setAuthCookies(response, accessToken, refreshToken)
  } catch (error) {
    return errorResponse(error)
  }
}
