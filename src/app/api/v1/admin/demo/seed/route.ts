import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseOptionalJsonBody } from "@/lib/infra/http/request"
import * as demoSeedService from "@/lib/services/admin/demo-seed-service"
import { demoSeedSchema } from "@/lib/validation/admin/demo-schema"

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const input = demoSeedSchema.parse(await parseOptionalJsonBody(request))
  const result = await demoSeedService.seedDemo(input)
  return successResponse(result, 201)
})
