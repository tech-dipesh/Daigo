import { compare } from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { issueTokenPair } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { setAuthCookies } from "@/lib/infra/auth/cookies"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const POST = withErrorHandling(async (request) => {
  const body = await parseJsonBody(request)
  const { email, password } = loginSchema.parse(body)
  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401)
  }
  const { accessToken, refreshToken } = await issueTokenPair(user.id)
  const response = successResponse({ userId: user.id, email: user.email }, 200)
  return setAuthCookies(response, accessToken, refreshToken)
})
