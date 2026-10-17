import { redis } from "@/lib/infra/clients/redis"
import { adminChannel, inboxKey, userChannel } from "@/lib/infra/realtime/events"
import type { EventType, RealtimeEvent } from "@/lib/infra/realtime/events"

const inboxMax = 50
const inboxTtlSeconds = 600
const dedupeTtlSeconds = 120
const makeEvent = (type: EventType, data: unknown): RealtimeEvent => ({ id: crypto.randomUUID(), type, data, at: new Date().toISOString() })

/*
  inbox list is the polling fallback
  incase the ws beta acts up, client reads /events
*/
export async function publishEvent(userId: string, type: EventType, data: unknown) {
  const event = makeEvent(type, data)
  const pipe = redis.pipeline()
  pipe.publish(userChannel(userId), event)
  pipe.lpush(inboxKey(userId), event)
  pipe.ltrim(inboxKey(userId), 0, inboxMax - 1)
  pipe.expire(inboxKey(userId), inboxTtlSeconds)
  try { await pipe.exec() } catch (error) { console.error("publish failed", error) }
}

export async function publishAdmin(type: EventType, data: unknown) {
  try { await redis.publish(adminChannel, makeEvent(type, data)) } catch (error) { console.error("admin publish failed", error) }
}

export async function publishOnce(key: string, userId: string, type: EventType, data: unknown) {
  try {
    const first = await redis.set(key, 1, { nx: true, ex: dedupeTtlSeconds })
    if (first) await publishEvent(userId, type, data)
  } catch (error) { console.error("publish once failed", error) }
}
