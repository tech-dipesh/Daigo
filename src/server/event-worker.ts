import { redis } from "@/lib/infra/clients/redis"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { onWake } from "@/lib/infra/realtime/hub"
import { aliveKey, drain, emit, ensureGroup, reclaim } from "@/lib/infra/realtime/stream"
import type { StreamEvent } from "@/lib/infra/realtime/stream"
import * as notificationRepo from "@/lib/repository/account/notification-repo"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"

const consumer = `ws-${process.pid}`
const minute = 60000
const lookBackMs = 5 * minute

/* notification.save is an upsert, so a retried event never saves a second row */
async function deliver({ id, userId, kind: type, title, body, data }: StreamEvent & { type: "notify" }) {
  await publishEvent(userId, "notification", { id, type, title, body, data })
  await notificationRepo.save({ id, userId, type, title, body, data })
}

async function handle(event: StreamEvent) {
  if (event.type === "notify") return deliver(event)
  const id = crypto.randomUUID()
  const data = { requestId: event.requestId, expired: true }
  const body = "Nobody accepted this time. You can try again, raise the price or join the waitlist."
  await publishEvent(event.riderId, "notification", { id, type: "TRIP_STATUS", title: "No driver yet", body, data })
  await notificationRepo.save({ id: crypto.randomUUID(), userId: event.riderId, type: "TRIP_STATUS", title: "No driver yet", body, data })
}

/* requests only expire by their timestamp, so this is what turns that into an event, once per request */
async function expireSweep() {
  const expired = await rideRequestRepo.recentlyExpired(new Date(Date.now() - lookBackMs))
  for (const request of expired) {
    const first = await redis.set(`expired:${request.id}`, "1", { nx: true, ex: 3600 })
    if (first) await emit({ type: "request.expired", requestId: request.id, riderId: request.riderId })
  }
}

export async function startWorker() {
  await ensureGroup()
  let busy = false
  const run = async () => {
    if (busy) return
    busy = true
    try { await drain(consumer, handle) } catch (err) { console.error("worker drain failed", err) } finally { busy = false }
  }
  const beat = () => redis.set(aliveKey, consumer, { ex: 90 })
  const sweep = async () => {
    try {
      await reclaim(consumer, handle)
      await expireSweep()
      await run()
    } catch (err) { console.error("worker sweep failed", err) }
  }
  onWake(() => void run())
  await beat()
  setInterval(() => void beat(), minute)
  setInterval(() => void sweep(), minute)
  void sweep()
  console.log("event worker is running")
}
