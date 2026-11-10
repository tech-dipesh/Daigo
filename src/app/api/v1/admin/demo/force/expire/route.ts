import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as demoForceService from "@/lib/services/admin/demo-force-service"
import { forceExpireSchema } from "@/lib/validation/admin/demo-schema"

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const input = forceExpireSchema.parse(await parseJsonBody(request))
  const result = await demoForceService.forceExpire(input)
  return successResponse(result)
})
