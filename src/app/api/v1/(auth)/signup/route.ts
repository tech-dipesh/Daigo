import { hash } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { issueTokenPair } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { setAuthCookies } from "@/lib/infra/cookies"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const POST = withErrorHandling(async (request) => {
  const body = await request.json()
  const { email, password } = signupSchema.parse(body)

  const existingUser = await db.user.findUnique({ where: { email } })

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409)
  }

  const passwordHash = await hash(password, 12)
  const user = await db.user.create({ data: { email, passwordHash } })

  const { accessToken, refreshToken } = await issueTokenPair(user.id)

  const response = successResponse({ userId: user.id, email: user.email }, 201)

  return setAuthCookies(response, accessToken, refreshToken)
})
