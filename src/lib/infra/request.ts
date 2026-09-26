import type { NextRequest } from "next/server"
import { AppError } from "@/lib/infra/response"

export async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new AppError("Please provide a valid JSON request body", 400)
  }
}
