import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as uploadService from "@/lib/services/upload-service"
import { uploadSignSchema } from "@/lib/validation/upload-schema"

export const POST = withErrorHandling(async (request) => {
  const input = uploadSignSchema.parse(await parseJsonBody(request))
  const signed = await uploadService.signNewUpload(getUserId(request), input)
  return successResponse(signed, 201)
})
