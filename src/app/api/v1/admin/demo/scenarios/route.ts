import { requireDemo } from "@/lib/infra/auth/demo-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseOptionalJsonBody } from "@/lib/infra/http/request"
import * as scenarioService from "@/lib/services/admin/scenario-service"
import { scenarioSchema } from "@/lib/validation/admin/demo-schema"

export const GET = withErrorHandling(async (request) => {
  await requireDemo(request)
  return successResponse({ scenarios: scenarioService.listScenarios() })
})

export const POST = withErrorHandling(async (request) => {
  await requireDemo(request)
  const input = scenarioSchema.parse(await parseOptionalJsonBody(request))
  const result = await scenarioService.runScenarios(input)
  return successResponse(result)
})
