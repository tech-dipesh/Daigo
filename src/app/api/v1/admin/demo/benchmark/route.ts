import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseOptionalJsonBody } from "@/lib/infra/http/request"
import * as benchmarkService from "@/lib/services/admin/benchmark-service"
import { benchmarkSchema } from "@/lib/validation/admin/demo-schema"

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const input = benchmarkSchema.parse(await parseOptionalJsonBody(request))
  const result = await benchmarkService.runBenchmark(input)
  return successResponse(result)
})
