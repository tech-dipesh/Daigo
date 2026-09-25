import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { issueTokenPair } from "@/lib/infra/auth"
import { AppError, errorResponse } from "@/lib/infra/errors"
import { setAuthCookies } from "@/lib/infra/cookies"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      throw new AppError("Please Enter a Correct Email", 401);
    }
    if (!(await compare(password, user.passwordHash))) {
      throw new AppError("Please Enter Correct Password", 401)
    }

    const { accessToken, refreshToken } = await issueTokenPair(user.id)

    const response = NextResponse.json(
      { success: true, data: { userId: user.id, email: user.email }, error: null },
      { status: 200 },
    )

    return setAuthCookies(response, accessToken, refreshToken)
  } catch (error) {
    return errorResponse(error)
  }
}
