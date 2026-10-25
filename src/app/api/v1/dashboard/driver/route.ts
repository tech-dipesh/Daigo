import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as dashboardService from "@/lib/services/dashboard-service"

export const GET = withErrorHandling(async (request) => {
  const dashboard = await dashboardService.driverDashboard(getUserId(request))
  return successResponse(dashboard)
})
