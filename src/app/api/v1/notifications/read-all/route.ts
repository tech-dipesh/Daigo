import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as notificationRepo from "@/lib/repository/notification-repo"

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { count } = await notificationRepo.markAllRead(userId)
  return successResponse({ updated: count })
})
