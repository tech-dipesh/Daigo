import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as safetyService from "@/lib/services/safety-service"
import { emergencyContactSchema } from "@/lib/validation/emergency-schema"

export const POST = withErrorHandling(async (request) => {
  const input = emergencyContactSchema.parse(await parseJsonBody(request))
  const contact = await safetyService.addContact(getUserId(request), input)
  return successResponse(contact, 201)
})

export const GET = withErrorHandling(async (request) => {
  const contacts = await safetyService.listContacts(getUserId(request))
  return successResponse(contacts)
})
