import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as safetyService from "@/lib/services/safety/safety-service"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const events = await safetyService.listOpenEmergencies()
  return successResponse(events)
})
