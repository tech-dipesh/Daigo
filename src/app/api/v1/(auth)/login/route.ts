import { NextResponse } from "next/server"
import { compare } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { issueTokenPair } from "@/lib/infra/auth"
import { AppError } from "@/lib/infra/errors"
import { setAuthCookies } from "@/lib/infra/cookies"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const POST = withErrorHandling(async (request) => {
  const body = await request.json()
  const { email, password } = loginSchema.parse(body)

  const user = await db.user.findUnique({ where: { email } })

  if (!user || !(await compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401)
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id)

  const response = NextResponse.json(
    { success: true, data: { userId: user.id, email: user.email }, error: null },
    { status: 200 },
  )

  return setAuthCookies(response, accessToken, refreshToken)
})
