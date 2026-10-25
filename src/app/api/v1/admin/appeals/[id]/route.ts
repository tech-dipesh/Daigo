import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as supportService from "@/lib/services/support-service"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import { appealDecisionSchema } from "@/lib/validation/admin-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const staff = await requireStaff(request)
  const id = await idFrom(params)
  const input = appealDecisionSchema.parse(await parseJsonBody(request))
  const decided = await supportService.decideAppeal(staff, id, input)
  return successResponse(decided)
})
