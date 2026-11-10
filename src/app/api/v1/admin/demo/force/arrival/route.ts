import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as demoForceService from "@/lib/services/admin/demo-force-service"
import { forceArrivalSchema } from "@/lib/validation/admin/demo-schema"

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const input = forceArrivalSchema.parse(await parseJsonBody(request))
  const result = await demoForceService.forceArrival(input)
  return successResponse(result)
})
