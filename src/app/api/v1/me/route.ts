import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as userService from "@/lib/services/user-service"
import { mePatchSchema } from "@/lib/validation/user-schema"

export const GET = withErrorHandling(async (request) => {
  const me = await userService.getMe(getUserId(request))
  return successResponse(me)
})

export const PATCH = withErrorHandling(async (request) => {
  const input = mePatchSchema.parse(await parseJsonBody(request))
  const user = await userService.updateMe(getUserId(request), input)
  return successResponse(user)
})
