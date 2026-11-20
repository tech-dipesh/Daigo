import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { withIdempotency } from "@/lib/infra/http/idempotency"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import { confirmCashWithProof } from "@/lib/services/payment/payment-proof-service"
import { proofSchema } from "@/lib/validation/trip/proof-schema"

export const POST = withErrorHandling<RouteParams>(withIdempotency(async (request, { params }) => {
  const id = await idFrom(params)
  const input = proofSchema.parse(await parseJsonBody(request))
  const payment = await confirmCashWithProof(getUserId(request), id, input)
  return successResponse(payment)
}))
