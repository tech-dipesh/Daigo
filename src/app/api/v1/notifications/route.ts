import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as notificationService from "@/lib/services/notification-service"
import { notificationQuerySchema } from "@/lib/validation/user-schema"

export const GET = withErrorHandling(async (request) => {
  const input = notificationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const feed = await notificationService.listNotifications(getUserId(request), input)
  return successResponse(feed)
})
