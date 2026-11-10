import { env } from "@/lib/infra/clients/env"
import { redis } from "@/lib/infra/clients/redis"
import { routeInfo } from "@/lib/infra/clients/stadia"
import { weatherMultiplier } from "@/lib/infra/clients/weather"
import { queueEnabled } from "@/lib/infra/queue/queue"
import * as demoResetRepo from "@/lib/repository/admin/demo-reset-repo"

type Check = { name: string; ok: boolean; ms: number; note: string }

async function check(name: string, run: () => Promise<{ ok: boolean; note: string }>): Promise<Check> {
  const started = Date.now()
  try {
    const { ok, note } = await run()
    return { name, ok, ms: Date.now() - started, note }
  } catch (error) {
    return { name, ok: false, ms: Date.now() - started, note: error instanceof Error ? error.message : "failed" }
  }
}

async function redisRoundTrip() {
  await redis.set("health:ping", "1", { ex: 10 })
  const back = await redis.get("health:ping")
  return { ok: String(back) === "1", note: "set and get worked" }
}

async function stadiaRoute() {
  const route = await routeInfo({ lat: 30.7398, lng: 76.7827 }, { lat: 30.7046, lng: 76.7179 })
  return { ok: route.km > 0, note: `${route.km.toFixed(1)} km, ${route.minutes} min (cached or straight line fallback counts too)` }
}

export async function runHealth() {
  const storageSet = Boolean(env.S3_BUCKET)
  return Promise.all([
    check("postgres and postgis", async () => ({ ok: true, note: await demoResetRepo.ping() })),
    check("redis", redisRoundTrip),
    check("stadia routing", stadiaRoute),
    check("weather", async () => (env.OWM_KEY ? { ok: true, note: `factor ${await weatherMultiplier(30.73, 76.77)}` } : { ok: true, note: "skipped, no OWM_KEY" })),
    check("file storage", async () => ({ ok: storageSet, note: storageSet ? `bucket ${env.S3_BUCKET}` : "S3_BUCKET not set" })),
    check("queue", async () => ({ ok: true, note: queueEnabled ? "qstash is on" : "running jobs inline, no public url or token" })),
    check("email", async () => ({ ok: Boolean(env.BREVO_API_KEY), note: "key is set, nothing was sent" })),
  ])
}
