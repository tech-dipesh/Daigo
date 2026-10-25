import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as noshowService from "@/lib/services/noshow-service"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await noshowService.markNoShow(getUserId(request), id)
  return successResponse(result)
})
