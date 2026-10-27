import { getUserId } from "@/lib/infra/auth/auth"
import { clearAuthCookies } from "@/lib/infra/auth/cookies"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as userService from "@/lib/services/user-service"
import { accountDeleteSchema, mePatchSchema } from "@/lib/validation/user-schema"

export const GET = withErrorHandling(async (request) => {
  const me = await userService.getMe(getUserId(request))
  return successResponse(me)
})

export const PATCH = withErrorHandling(async (request) => {
  const input = mePatchSchema.parse(await parseJsonBody(request))
  const user = await userService.updateMe(getUserId(request), input)
  return successResponse(user)
})

export const DELETE = withErrorHandling(async (request) => {
  const input = accountDeleteSchema.parse(await parseJsonBody(request))
  const result = await userService.deleteMe(getUserId(request), input)
  return clearAuthCookies(successResponse(result))
})
