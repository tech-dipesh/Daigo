import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as presenceService from "@/lib/services/driver/presence-service"
import { presenceSchema } from "@/lib/validation/driver/realtime-schema"

export const POST = withErrorHandling(async (request) => {
  const { online } = presenceSchema.parse(await parseJsonBody(request))
  const result = await presenceService.reportPresence(getUserId(request), online)
  return successResponse(result)
})
