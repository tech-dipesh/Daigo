import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as exportService from "@/lib/services/admin/export-service"
import { exportSchema } from "@/lib/validation/admin/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request, "SUPER_ADMIN")
  const rows = await exportService.listExports()
  return successResponse(rows)
})

export const POST = withErrorHandling(async (request) => {
  const staff = await requireStaff(request, "SUPER_ADMIN")
  const input = exportSchema.parse(await parseJsonBody(request))
  const queued = await exportService.queueExport(input, staff.id)
  return successResponse(queued, 202)
})
