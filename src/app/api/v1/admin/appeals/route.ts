import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as supportService from "@/lib/services/safety/support-service"
import { appealListQuerySchema } from "@/lib/validation/admin/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { status } = appealListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const appeals = await supportService.listAppeals(status)
  return successResponse(appeals)
})
