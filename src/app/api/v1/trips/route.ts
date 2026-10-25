import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as shareService from "@/lib/services/share-service"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams<{ token: string }>>(async (_request, { params }) => {
  const { token } = await params
  const view = await shareService.sharedView(token)
  return successResponse(view)
})
