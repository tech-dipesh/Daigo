import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as notificationRepo from "@/lib/repository/notification-repo"
import type { RouteParams } from "@/types/api"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const found = await notificationRepo.findOwned(id, userId)
  if (!found) throw new AppError("Notification not found", 404)
  const updated = await notificationRepo.markRead(id, found.readAt ?? new Date())
  return successResponse(updated)
})
