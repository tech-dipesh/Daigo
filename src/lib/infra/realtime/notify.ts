import { db } from "@/lib/infra/clients/db"
import { publishEvent } from "@/lib/infra/realtime/publish"

type NotificationType = "MATCH_ACCEPTED" | "TRIP_STATUS" | "PAYMENT" | "VERIFICATION" | "WARNING" | "BAN" | "APPEAL" | "COMPLAINT" | "OFFER" | "WAITLIST" | "SAVINGS"
type NotificationData = Record<string, string | number | boolean | null>

export async function notify(userId: string, type: NotificationType, title: string, body: string, data: NotificationData = {}) {
  try {
    const row = await db.notification.create({ data: { userId, type, title, body, data } })
    await publishEvent(userId, "notification", { id: row.id, type, title, body, data })
  } catch (error) { console.error("notify failed", error) }
}
