import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as notificationService from "@/lib/services/notification-service"

export const POST = withErrorHandling(async (request) => {
  const result = await notificationService.markAllRead(getUserId(request))
  return successResponse(result)
})
