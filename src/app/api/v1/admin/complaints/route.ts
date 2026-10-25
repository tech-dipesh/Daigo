import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as supportService from "@/lib/services/support-service"
import { complaintListQuerySchema } from "@/lib/validation/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { status } = complaintListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const complaints = await supportService.listComplaints(status)
  return successResponse(complaints)
})
