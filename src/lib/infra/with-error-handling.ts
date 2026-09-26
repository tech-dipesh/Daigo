import type { NextRequest, NextResponse } from "next/server"
import { errorResponse } from "@/lib/infra/response"

type RouteHandler<Context> = (request: NextRequest, context: Context) => Promise<NextResponse>

export function withErrorHandling<Context = unknown>(
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
