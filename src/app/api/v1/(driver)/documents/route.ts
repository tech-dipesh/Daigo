import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as driverService from "@/lib/services/driver/driver-service"
import { driverDocumentSchema } from "@/lib/validation/driver/driver-schema"

export const POST = withErrorHandling(async (request) => {
  const input = driverDocumentSchema.parse(await parseJsonBody(request))
  const document = await driverService.submitLicence(getUserId(request), input)
  return successResponse(document, 201)
})

export const GET = withErrorHandling(async (request) => {
  const documents = await driverService.listLicences(getUserId(request))
  return successResponse(documents)
})
