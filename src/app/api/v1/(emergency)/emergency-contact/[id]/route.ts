import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as contactService from "@/lib/services/safety/contact-service"
import { contactUpdateSchema } from "@/lib/validation/safety/contact-update-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = contactUpdateSchema.parse(await parseJsonBody(request))
  const contact = await contactService.updateContact(getUserId(request), id, input)
  return successResponse(contact)
})

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const result = await contactService.removeContact(getUserId(request), id)
  return successResponse(result)
})
