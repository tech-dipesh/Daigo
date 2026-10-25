import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as safetyService from "@/lib/services/safety-service"
import type { RouteParams } from "@/types/api"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const event = await safetyService.resolveEmergency(id)
  return successResponse(event)
})
