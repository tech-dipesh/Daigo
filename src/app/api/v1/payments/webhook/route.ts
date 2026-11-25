import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as gatewayService from "@/lib/services/payment/payment-gateway-service"

export const POST = withErrorHandling(async (request) => {
  const raw = await request.text()
  const result = await gatewayService.handleWebhook(raw, request.headers.get("x-razorpay-signature"), request.headers.get("x-razorpay-event-id"))
  return successResponse(result)
})
