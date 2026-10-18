import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { count } = await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
  return successResponse({ updated: count })
})
