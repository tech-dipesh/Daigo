import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as notificationService from "@/lib/services/account/notification-service"
import { notificationQuerySchema } from "@/lib/validation/account/user-schema"

export const GET = withErrorHandling(async (request) => {
  const query = notificationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const result = await notificationService.listNotifications(getUserId(request), query)
  return successResponse(result)
})
