import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as supportService from "@/lib/services/safety/support-service"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import { complaintDecisionSchema } from "@/lib/validation/admin/admin-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const staff = await requireStaff(request)
  const id = await idFrom(params)
  const input = complaintDecisionSchema.parse(await parseJsonBody(request))
  const complaint = await supportService.decideComplaint(staff, id, input)
  return successResponse(complaint)
})
