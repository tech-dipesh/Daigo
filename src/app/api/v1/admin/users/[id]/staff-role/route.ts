import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as adminService from "@/lib/services/admin/admin-service"
import { staffRoleSchema } from "@/lib/validation/admin/admin-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const admin = await requireStaff(request, "SUPER_ADMIN")
  const id = await idFrom(params)
  const input = staffRoleSchema.parse(await parseJsonBody(request))
  const user = await adminService.changeStaffRole(admin, id, input)
  return successResponse(user)
})
