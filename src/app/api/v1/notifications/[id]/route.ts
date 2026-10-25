import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as notificationService from "@/lib/services/notification-service"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const notification = await notificationService.markRead(getUserId(request), id)
  return successResponse(notification)
})
