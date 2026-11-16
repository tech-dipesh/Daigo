import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import * as tripService from "@/lib/services/trip/trip-service"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const trip = await tripService.getTrip(getUserId(request), id)
  return successResponse(trip)
})

export const POST = withErrorHandling<RouteParams>(withIdempotency(async (request, { params }) => {
  const id = await idFrom(params)
  const input = paymentSchema.parse(await parseJsonBody(request))
  const payment = await paymentService.payTrip(getUserId(request), id, input)
  return successResponse(payment, 201)
}))
