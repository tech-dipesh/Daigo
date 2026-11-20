import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as photoService from "@/lib/services/account/photo-service"
import { photoSchema } from "@/lib/validation/account/photo-schema"

export const PATCH = withErrorHandling(async (request) => {
  const input = photoSchema.parse(await parseJsonBody(request))
  const result = await photoService.setPhoto(getUserId(request), input)
  return successResponse(result)
})
