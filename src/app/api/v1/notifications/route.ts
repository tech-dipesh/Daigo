import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

const querySchema = z.object({
  unread: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.uuid().optional(),
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { unread, limit, cursor } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const where = unread === "true" ? { userId, readAt: null } : { userId }
  const page = cursor ? { cursor: { id: cursor }, skip: 1 } : {}
  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: limit + 1, ...page }),
    db.notification.count({ where: { userId, readAt: null } }),
  ])
  const items = rows.slice(0, limit)
  const nextCursor = rows.length > limit ? (items[items.length - 1]?.id ?? null) : null
  return successResponse({ items, nextCursor, unreadCount })
})
