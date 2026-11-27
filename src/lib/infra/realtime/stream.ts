import { z } from "zod"
import { redis } from "@/lib/infra/clients/redis"
import { notificationTypes } from "@/lib/infra/queue/types"
import { wakeChannel } from "@/lib/infra/realtime/events"

export const streamKey = "daigo:events"
export const deadKey = "daigo:events:dead"
export const aliveKey = "daigo:worker:alive"
const triesKey = "daigo:events:tries"
const group = "workers"
const maxLength = 5000
const maxTries = 5
const idleMs = 30000
const batch = 20

const data = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notify"), id: z.uuid(), userId: z.uuid(), kind: z.enum(notificationTypes), title: z.string(), body: z.string(), data }),
  z.object({ type: z.literal("request.expired"), requestId: z.uuid(), riderId: z.uuid() }),
])

export type StreamEvent = z.infer<typeof eventSchema>
type Entry = { id: string; event: StreamEvent | null; raw: string }

export async function emit(event: StreamEvent) {
  await redis.xadd(streamKey, "*", { event: JSON.stringify(event) }, { trim: { type: "MAXLEN", comparison: "~", threshold: maxLength } })
  await redis.publish(wakeChannel, "1")
}

/* the worker writes this every minute, when it is gone producers send the old direct way */
export const workerAlive = async () => Boolean(await redis.get(aliveKey))

export async function ensureGroup() {
  try {
    await redis.xgroup(streamKey, { type: "CREATE", group, id: "0", options: { MKSTREAM: true } })
  } catch { return }
}

/* upstash gives back raw arrays: [[stream, [[id, [field, value, ...]]]]] and the value may already be parsed */
function entriesOf(reply: unknown): Entry[] {
  if (!Array.isArray(reply)) return []
  const rows: unknown[] = reply.flatMap((stream) => (Array.isArray(stream) && Array.isArray(stream[1]) ? stream[1] : []))
  return rows.flatMap((row) => {
    if (!Array.isArray(row) || typeof row[0] !== "string" || !Array.isArray(row[1])) return []
    const at = row[1].indexOf("event")
    const value: unknown = at >= 0 ? row[1][at + 1] : null
    const raw = typeof value === "string" ? value : JSON.stringify(value)
    try {
      const parsed = eventSchema.safeParse(typeof value === "string" ? JSON.parse(value) : value)
      return [{ id: row[0], event: parsed.success ? parsed.data : null, raw }]
    } catch { return [{ id: row[0], event: null, raw }] }
  })
}

async function bury(entry: Entry, why: string) {
  await redis.xadd(deadKey, "*", { id: entry.id, why, event: entry.raw }, { trim: { type: "MAXLEN", comparison: "~", threshold: 1000 } })
  await redis.xack(streamKey, group, entry.id)
  await redis.hdel(triesKey, entry.id)
}

/* a failed event stays pending and comes back through reclaim, after five tries it goes to the dead stream */
async function work(entry: Entry, consumer: string, handler: (event: StreamEvent) => Promise<void>) {
  if (!entry.event) return bury(entry, "unreadable event")
  try {
    await handler(entry.event)
    await redis.xack(streamKey, group, entry.id)
  } catch (err) {
    console.error("event failed", entry.id, consumer, err)
    const tries = await redis.hincrby(triesKey, entry.id, 1)
    if (tries >= maxTries) await bury(entry, err instanceof Error ? err.message : "failed")
  }
}

export async function drain(consumer: string, handler: (event: StreamEvent) => Promise<void>) {
  for (;;) {
    const entries = entriesOf(await redis.xreadgroup(group, consumer, streamKey, ">", { count: batch }))
    if (!entries.length) return
    for (const entry of entries) await work(entry, consumer, handler)
  }
}

export async function reclaim(consumer: string, handler: (event: StreamEvent) => Promise<void>) {
  const claimed = await redis.xautoclaim(streamKey, group, consumer, idleMs, "0", { count: batch })
  const entries = entriesOf([[streamKey, Array.isArray(claimed) ? claimed[1] : []]])
  for (const entry of entries) await work(entry, consumer, handler)
}

export async function streamStats() {
  const [length, dead, alive] = await Promise.all([redis.xlen(streamKey), redis.xlen(deadKey), workerAlive()])
  return { length, dead, alive }
}
