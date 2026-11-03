import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as adminService from "@/lib/services/admin/admin-service"
import { verificationQuerySchema } from "@/lib/validation/admin/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const input = verificationQuerySchema.parse({ status: request.nextUrl.searchParams.get("status") ?? undefined })
  const verifications = await adminService.listVerifications(input)
  return successResponse(verifications)
})
