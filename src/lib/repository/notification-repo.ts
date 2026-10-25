import { db } from "@/lib/infra/clients/db"

type NewNotification = { id: string; userId: string; type: "MATCH_ACCEPTED" | "TRIP_STATUS" | "PAYMENT" | "VERIFICATION" | "WARNING" | "BAN" | "APPEAL" | "COMPLAINT" | "OFFER" | "WAITLIST" | "SAVINGS" | "EXPORT"; title: string; body: string; data: Record<string, string | number | boolean | null> }

const newestFirst = { createdAt: "desc" } as const

export function page(userId: string, unreadOnly: boolean, take: number, cursor?: string) {
  const where = unreadOnly ? { userId, readAt: null } : { userId }
  if (cursor) return db.notification.findMany({ where, orderBy: newestFirst, take, cursor: { id: cursor }, skip: 1 })
  return db.notification.findMany({ where, orderBy: newestFirst, take })
}

export const unreadCount = (userId: string) => db.notification.count({ where: { userId, readAt: null } })
export const findOwned = (id: string, userId: string) => db.notification.findFirst({ where: { id, userId } })
export const markRead = (id: string, readAt: Date) => db.notification.update({ where: { id }, data: { readAt } })
export const markAllRead = (userId: string) => db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })

/* upsert by id so a queue retry never makes a duplicate row */
export const save = ({ id, ...data }: NewNotification) => db.notification.upsert({ where: { id }, create: { id, ...data }, update: {} })
