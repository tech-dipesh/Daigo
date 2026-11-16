import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { withIdempotency } from "@/lib/infra/http/idempotency"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as paymentService from "@/lib/services/payment/payment-service"
import { paymentSchema } from "@/lib/validation/trip/trip-schema"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const payment = await paymentService.getPayment(getUserId(request), id)
  return successResponse(payment)
})

export const POST = withErrorHandling<RouteParams>(withIdempotency(async (request, { params }) => {
  const id = await idFrom(params)
  const input = paymentSchema.parse(await parseJsonBody(request))
  const payment = await paymentService.payTrip(getUserId(request), id, input)
  return successResponse(payment, 201)
}))
