import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { consumeVerificationToken } from "@/lib/infra/verification-token"

const confirmSchema = z.object({
  token: z.string().min(1),
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { token } = confirmSchema.parse(await parseJsonBody(request))

  const verifiedUserId = await consumeVerificationToken(token, "EMAIL_VERIFICATION")
  console.log("verifed userid", verifiedUserId);
  // console.log("userId", userId);
  if (!verifiedUserId || verifiedUserId !== userId) {
    throw new AppError("This verification code is invalid or has expired", 400)
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true, emailVerifiedAt: true },
  })

  return successResponse(user)
})
