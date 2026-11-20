import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as permanentService from "@/lib/services/ride/permanent-service"
import { permanentSchema } from "@/lib/validation/ride/permanent-schema"

export const GET = withErrorHandling(async (request) => {
  const list = await permanentService.listPermanent(getUserId(request))
  return successResponse(list)
})

export const POST = withErrorHandling(async (request) => {
  const input = permanentSchema.parse(await parseJsonBody(request))
  const created = await permanentService.createPermanent(getUserId(request), input)
  return successResponse(created, 201)
})
