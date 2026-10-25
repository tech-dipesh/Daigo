import { AppError } from "@/lib/infra/http/response"
import * as notificationRepo from "@/lib/repository/notification-repo"
import type { NotificationQueryInput } from "@/lib/validation/user-schema"

export async function listNotifications(userId: string, { unread, limit, cursor }: NotificationQueryInput) {
  const [rows, unreadCount] = await Promise.all([notificationRepo.page(userId, unread === "true", limit + 1, cursor), notificationRepo.unreadCount(userId)])
  const items = rows.slice(0, limit)
  const nextCursor = rows.length > limit ? (items[items.length - 1]?.id ?? null) : null
  return { items, nextCursor, unreadCount }
}

export async function markRead(userId: string, id: string) {
  const found = await notificationRepo.findOwned(id, userId)
  if (!found) throw new AppError("Notification not found", 404)
  return notificationRepo.markRead(id, found.readAt ?? new Date())
}

export async function markAllRead(userId: string) {
  const { count } = await notificationRepo.markAllRead(userId)
  return { updated: count }
}
