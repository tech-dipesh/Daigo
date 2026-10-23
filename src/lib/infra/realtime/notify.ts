import { publishEvent } from "@/lib/infra/realtime/publish"
import { enqueue } from "@/lib/infra/queue/queue"
import type { NotificationType } from "@/lib/infra/queue/types"

type NotificationData = Record<string, string | number | boolean | null>

/*
  event goes out live from redis first
  the db row is saved later by the queue job
*/
export async function notify(userId: string, type: NotificationType, title: string, body: string, data: NotificationData = {}) {
  const id = crypto.randomUUID()
  await publishEvent(userId, "notification", { id, type, title, body, data })
  await enqueue({ name: "notification.save", payload: { id, userId, type, title, body, data } })
}
