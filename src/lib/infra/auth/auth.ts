import type { NextRequest } from "next/server"
import { AppError } from "@/lib/infra/http/response"

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get("x-user-id")
  if (!userId) throw new AppError("Not authenticated", 401)
  return userId
}
