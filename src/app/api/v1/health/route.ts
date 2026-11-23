import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as healthService from "@/lib/services/system/health-service"

export const dynamic = "force-dynamic"

export const GET = withErrorHandling(async () => {
  const { database, cache, uptime } = await healthService.checkHealth()
  const checks = [database ? "" : "database", cache ? "" : "cache"]
  const failed = checks.filter(Boolean)
  if (failed.length) throw new AppError(`Not healthy: ${failed.join(", ")}`, 503)
  return successResponse({ status: "ok", uptime })
})
