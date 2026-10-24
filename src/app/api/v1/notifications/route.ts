import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { notificationQuerySchema } from "@/lib/validation/user-schema"
import * as notificationRepo from "@/lib/repository/notification-repo"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { unread, limit, cursor } = notificationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const [rows, unreadCount] = await Promise.all([notificationRepo.page(userId, unread === "true", limit + 1, cursor), notificationRepo.unreadCount(userId)])
  const items = rows.slice(0, limit)
  const nextCursor = rows.length > limit ? (items[items.length - 1]?.id ?? null) : null
  return successResponse({ items, nextCursor, unreadCount })
})
