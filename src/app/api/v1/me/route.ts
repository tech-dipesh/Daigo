import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, activeRole: true, createdAt: true },
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return successResponse(user)
})
