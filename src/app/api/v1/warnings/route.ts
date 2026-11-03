import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { getWarningSummary } from "@/lib/infra/economy/warnings"
import { warningQuerySchema } from "@/lib/validation/account/user-schema"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { scope } = warningQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const summary = await getWarningSummary(userId, scope)
  return successResponse(summary)
})
