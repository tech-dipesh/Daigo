import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import type { RouteParams } from "@/types/api"
import * as adminService from "@/lib/services/admin-service"
import { fareRatePatchSchema, fareRateTypeSchema } from "@/lib/validation/admin-schema"

export const PATCH = withErrorHandling<RouteParams<{ type: string }>>(async (request, { params }) => {
  await requireStaff(request)
  const { type } = fareRateTypeSchema.parse(await params)
  const input = fareRatePatchSchema.parse(await parseJsonBody(request))
  const rate = await adminService.setFareRate(type, input)
  return successResponse(rate)
})
