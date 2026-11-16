import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { withIdempotency } from "@/lib/infra/http/idempotency"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import * as paymentService from "@/lib/services/payment/payment-service"
import { paymentConfirmSchema } from "@/lib/validation/trip/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const id = await idFrom(params)
  const input = paymentConfirmSchema.parse(await parseJsonBody(request))
  const paid = await paymentService.confirmCash(getUserId(request), id, input)
  return successResponse(paid)
})
