import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as adminService from "@/lib/services/admin/admin-service"
import { documentReviewSchema } from "@/lib/validation/admin/admin-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const input = documentReviewSchema.parse(await parseJsonBody(request))
  const document = await adminService.reviewDocument(id, input)
  return successResponse(document)
})
