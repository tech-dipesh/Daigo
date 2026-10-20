import { z } from "zod"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { getWarningSummary } from "@/lib/infra/economy/warnings"

const querySchema = z.object({ scope: z.enum(["current", "all"]).default("current") })

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { scope } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const summary = await getWarningSummary(userId, scope)
  return successResponse(summary)
})
