import type { RawData, WebSocket } from "ws"
import { listen } from "@/lib/infra/realtime/hub"
import { setOffline, setOnline } from "@/lib/infra/realtime/presence"
import type * as userRepo from "@/lib/repository/account/user-repo"
import { wsMessageSchema } from "@/lib/validation/driver/realtime-schema"

const openState = 1

type Who = { userId: string } & Awaited<ReturnType<typeof userRepo.roles>>

function parseMessage(raw: RawData) {
  try { return wsMessageSchema.safeParse(JSON.parse(raw.toString())) } catch { return null }
}

/* shared by the vercel route and the ec2 ws server, so both behave the same */
export function attachSocket(ws: WebSocket, { userId, activeRole, staffRole }: Who) {
  let live = false
  const stop = listen(userId, Boolean(staffRole), (event) => {
    if (ws.readyState === openState) ws.send(JSON.stringify(event))
  })
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
    stop()
    await setOffline(userId)
  })
}
