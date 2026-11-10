import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as demoHealthService from "@/lib/services/admin/demo-health-service"

export const GET = withErrorHandling(async (request) => {
  await requireDemo(request)
  const checks = await demoHealthService.runHealth()
  return successResponse({ ok: checks.every((c) => c.ok), checks })
})
