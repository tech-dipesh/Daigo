import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as gatewayService from "@/lib/services/payment/payment-gateway-service"
import { verifySchema } from "@/lib/validation/payment/gateway-schema"

export const POST = withErrorHandling(async (request) => {
  const input = verifySchema.parse(await parseJsonBody(request))
  const result = await gatewayService.verifyCheckout(getUserId(request), input)
  return successResponse(result)
})
