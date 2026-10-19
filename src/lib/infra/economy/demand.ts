import { db } from "@/lib/infra/clients/db"
import { redis } from "@/lib/infra/clients/redis"
import { onlineCount } from "@/lib/infra/realtime/presence"

export const busyMultiplier = 1.15
const highRatio = 2
const lowRatio = 1
const stateKey = "demand:state"

/*
  open requests vs online drivers, global on purpose
  two thresholds so price dont flicker around one number
*/
export async function demandMultiplier() {
  const [open, online, state] = await Promise.all([
    db.rideRequest.count({ where: { status: "PENDING", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
    onlineCount(),
    redis.get<string>(stateKey),
  ])
  const ratio = open / Math.max(online, 1)
  const busy = state === "busy" ? ratio > lowRatio : ratio >= highRatio
  await redis.set(stateKey, busy ? "busy" : "calm", { ex: 3600 })
  return busy ? busyMultiplier : 1
}
