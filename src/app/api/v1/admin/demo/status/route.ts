import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as demoSeedService from "@/lib/services/admin/demo-seed-service"

export const GET = withErrorHandling(async (request) => {
  await requireDemo(request)
  const status = await demoSeedService.demoStatus()
  return successResponse(status)
})
