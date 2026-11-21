import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as userAdminService from "@/lib/services/admin/user-admin-service"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const user = await userAdminService.userDetail(id)
  return successResponse(user)
})
