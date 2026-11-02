import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as userService from "@/lib/services/account/user-service"

export const GET = withErrorHandling(async (request) => {
  const status = await userService.getCoinStatus(getUserId(request))
  return successResponse(status)
})
