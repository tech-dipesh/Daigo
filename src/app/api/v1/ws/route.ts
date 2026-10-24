import { upgradeWebSocket } from "@vercel/functions"
import type { WebSocketData } from "@vercel/functions"
import type { NextRequest } from "next/server"
import { db } from "@/lib/infra/clients/db"
import { redis } from "@/lib/infra/clients/redis"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, errorResponse } from "@/lib/infra/http/response"
import { adminChannel, userChannel } from "@/lib/infra/realtime/events"
import type { RealtimeEvent } from "@/lib/infra/realtime/events"
import { setOffline, setOnline } from "@/lib/infra/realtime/presence"
import { wsMessageSchema } from "@/lib/validation/realtime-schema"

/*
  conn dies at max duration, client must reconnect
  hobby cap is 300 i think, ill check
*/
export const maxDuration = 300

function parseMessage(raw: WebSocketData) {
  try { return wsMessageSchema.safeParse(JSON.parse(raw.toString())) } catch { return null }
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  const { activeRole, staffRole } = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { activeRole: true, staffRole: true } })
  const channels = staffRole ? [userChannel(userId), adminChannel] : [userChannel(userId)]
  try {
    return upgradeWebSocket((ws) => {
      let live = false
      const sub = redis.subscribe<RealtimeEvent>(channels)
      sub.on("message", ({ message }) => ws.send(JSON.stringify(message)))
      ws.send(JSON.stringify({ type: "ready" }))
      ws.on("message", async (raw: WebSocketData) => {
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
    })
  } catch (error) {
    console.error(error)
    return errorResponse(new AppError("WebSocket is not available here, poll /api/v1/events instead", 501))
  }
}
