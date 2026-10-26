import type { NextRequest } from "next/server"
import { AppError } from "@/lib/infra/http/response"

export async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new AppError("Please provide a valid JSON request body", 400)
  }
}

/* for routes where the body is optional, empty means {} */
export async function parseOptionalJsonBody(request: NextRequest): Promise<unknown> {
  const raw = await request.text()
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new AppError("Please provide a valid JSON request body", 400)
  }
}
