import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as adminService from "@/lib/services/admin/admin-service"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const stats = await adminService.getStats()
  return successResponse(stats)
})
