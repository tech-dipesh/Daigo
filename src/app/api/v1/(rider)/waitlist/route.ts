import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as requestService from "@/lib/services/request-service"

export const GET = withErrorHandling(async (request) => {
  const entries = await requestService.listWaitlist(getUserId(request))
  return successResponse(entries)
})
