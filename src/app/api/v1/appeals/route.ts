import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as supportService from "@/lib/services/safety/support-service"
import { appealSchema } from "@/lib/validation/safety/support-schema"

export const GET = withErrorHandling(async (request) => {
  const appeals = await supportService.listMyAppeals(getUserId(request))
  return successResponse(appeals)
})

export const POST = withErrorHandling(async (request) => {
  const input = appealSchema.parse(await parseJsonBody(request))
  const appeal = await supportService.fileAppeal(getUserId(request), input)
  return successResponse(appeal, 201)
})
