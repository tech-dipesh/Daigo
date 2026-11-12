import { upgradeWebSocket } from "@vercel/functions"
import type { NextRequest } from "next/server"
import * as userRepo from "@/lib/repository/account/user-repo"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, errorResponse } from "@/lib/infra/http/response"
import { attachSocket } from "@/lib/infra/realtime/socket"

/*
  conn dies at max duration, client must reconnect
  hobby cap is 300 i think, ill check
*/
export const maxDuration = 300

export async function GET(request: NextRequest) {
  // on ec2 caddy sends this path to the ws container, so reaching here means a wrong proxy rule
  if (!process.env.VERCEL) return errorResponse(new AppError("WebSocket runs in the ws container on this host, check the proxy rule", 501))
  const userId = getUserId(request)
  const roles = await userRepo.roles(userId)
  try {
    return await upgradeWebSocket((ws) => attachSocket(ws, { userId, ...roles }))
  } catch (error) {
    console.error(error)
    return errorResponse(new AppError("WebSocket is not available here, poll /api/v1/events instead", 501))
  }
}
