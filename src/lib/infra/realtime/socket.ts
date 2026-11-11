import type { RawData, WebSocket } from "ws"
import { redis } from "@/lib/infra/clients/redis"
import { adminChannel, userChannel } from "@/lib/infra/realtime/events"
import type { RealtimeEvent } from "@/lib/infra/realtime/events"
import { setOffline, setOnline } from "@/lib/infra/realtime/presence"
import type * as userRepo from "@/lib/repository/account/user-repo"
import { wsMessageSchema } from "@/lib/validation/driver/realtime-schema"

type Who = { userId: string } & Awaited<ReturnType<typeof userRepo.roles>>

function parseMessage(raw: RawData) {
  try { return wsMessageSchema.safeParse(JSON.parse(raw.toString())) } catch { return null }
}

/* shared by the vercel route and the ec2 ws server, so both behave the same */
export function attachSocket(ws: WebSocket, { userId, activeRole, staffRole }: Who) {
  let live = false
  const channels = staffRole ? [userChannel(userId), adminChannel] : [userChannel(userId)]
  const sub = redis.subscribe<RealtimeEvent>(channels)
  sub.on("message", ({ message }) => ws.send(JSON.stringify(message)))
  ws.send(JSON.stringify({ type: "ready" }))
  ws.on("message", async (raw) => {
    const parsed = parseMessage(raw)
    if (!parsed?.success) return ws.send(JSON.stringify({ type: "error", message: "Unknown message" }))
    const { type } = parsed.data
    if (type === "online" && activeRole === "DRIVER") live = true
    if (type === "offline") live = false
    if (live) await setOnline(userId)
    else await setOffline(userId)
  })
  ws.on("close", async () => {
    await sub.unsubscribe()
    await setOffline(userId)
  })
}
