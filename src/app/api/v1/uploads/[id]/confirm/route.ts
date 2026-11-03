import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as uploadService from "@/lib/services/driver/upload-service"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const upload = await uploadService.confirmUpload(getUserId(request), id)
  return successResponse(upload)
})
