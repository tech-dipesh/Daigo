import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as matchInboxService from "@/lib/services/ride/match-inbox-service"

export const GET = withErrorHandling(async (request) => {
  const relays = await matchInboxService.listIncomingRelays(getUserId(request))
  return successResponse(relays)
})
