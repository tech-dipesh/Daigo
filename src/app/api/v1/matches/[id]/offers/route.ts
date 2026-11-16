import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as offerService from "@/lib/services/ride/offer-service"
import { offerSchema } from "@/lib/validation/ride/match-schema"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const offers = await offerService.getOffers(getUserId(request), id)
  return successResponse(offers)
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = offerSchema.parse(await parseJsonBody(request))
  const offer = await offerService.makeOffer(getUserId(request), id, input)
  return successResponse(offer, 201)
})
