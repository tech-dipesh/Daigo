import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { verifyOtp } from "@/lib/infra/auth/otp"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/) })

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { code } = codeSchema.parse(await parseJsonBody(request))
  const ok = await verifyOtp(userId, "EMAIL_VERIFY", code)
  if (!ok) throw new AppError("Invalid or expired code", 400)
  const user = await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() }, select: { id: true, email: true, emailVerifiedAt: true } })
  return successResponse(user)
})
