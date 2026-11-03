import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as safetyService from "@/lib/services/safety/safety-service"
import { emergencySchema } from "@/lib/validation/safety/emergency-schema"

export const POST = withErrorHandling(async (request) => {
  const input = emergencySchema.parse(await parseJsonBody(request))
  const event = await safetyService.triggerEmergency(getUserId(request), input)
  return successResponse(event, 201)
})
