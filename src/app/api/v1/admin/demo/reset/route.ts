import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as demoSeedService from "@/lib/services/admin/demo-seed-service"

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const result = await demoSeedService.resetDemo()
  return successResponse(result)
})
