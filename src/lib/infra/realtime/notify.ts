import { publishEvent } from "@/lib/infra/realtime/publish"
import { emit, workerAlive } from "@/lib/infra/realtime/stream"
import { enqueue } from "@/lib/infra/queue/queue"
import type { NotificationType } from "@/lib/infra/queue/types"

type NotificationData = Record<string, string | number | boolean | null>

/*
  the event goes to the redis stream and the worker sends it live and saves the row
  no worker (local dev, or it is down) or no stream, then it goes the old direct way so nothing waits for ever
*/
export async function notify(userId: string, type: NotificationType, title: string, body: string, data: NotificationData = {}) {
  const id = crypto.randomUUID()
  try {
    if (await workerAlive()) return await emit({ type: "notify", id, userId, kind: type, title, body, data })
  } catch (err) {
    console.error("stream is not reachable, sending directly", err)
  }
  await publishEvent(userId, "notification", { id, type, title, body, data })
  await enqueue({ name: "notification.save", payload: { id, userId, type, title, body, data } })
}
