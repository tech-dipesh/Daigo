import "dotenv/config"
import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import { verifyAccessToken } from "@/lib/infra/auth/token"
import { attachSocket } from "@/lib/infra/realtime/socket"
import { startWorker } from "@/server/event-worker"
import * as userRepo from "@/lib/repository/account/user-repo"

const port = Number(process.env.PORT ?? 3001)
const wss = new WebSocketServer({ noServer: true })

function cookie(header: string | undefined, name: string) {
  const pairs = (header ?? "").split(";")
  const trimmed = pairs.map((pair) => pair.trim())
  const hit = trimmed.find((pair) => pair.startsWith(`${name}=`))
  return hit?.slice(name.length + 1)
}

const server = createServer((req, res) => {
  res.writeHead(req.url === "/health" ? 200 : 404).end()
})

server.on("upgrade", async (req, socket, head) => {
  try {
    const token = cookie(req.headers.cookie, "access_token")
    const payload = token ? await verifyAccessToken(token) : null
    if (!payload) throw new Error("not authenticated")
    const roles = await userRepo.roles(payload.userId)
    wss.handleUpgrade(req, socket, head, (ws) => attachSocket(ws, { userId: payload.userId, ...roles }))
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
    socket.destroy()
  }
})

server.listen(port, () => {
  console.log(`ws server on ${port}`)
  startWorker().catch((err) => console.error("event worker did not start", err))
})
