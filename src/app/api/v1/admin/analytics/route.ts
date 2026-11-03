import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as analyticsService from "@/lib/services/admin/analytics-service"
import { analyticsQuerySchema } from "@/lib/validation/admin/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { days } = analyticsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const analytics = await analyticsService.getAnalytics(days)
  return successResponse(analytics)
})
