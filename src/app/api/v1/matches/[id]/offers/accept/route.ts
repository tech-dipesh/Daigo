import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as offerService from "@/lib/services/offer-service"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const accepted = await offerService.acceptOffer(getUserId(request), id)
  return successResponse(accepted)
})
