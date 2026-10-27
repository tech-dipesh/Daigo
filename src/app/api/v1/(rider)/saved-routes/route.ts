import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as savedRouteService from "@/lib/services/saved-route-service"
import { savedRouteSchema } from "@/lib/validation/saved-route-schema"

export const GET = withErrorHandling(async (request) => {
  const routes = await savedRouteService.listSaved(getUserId(request))
  return successResponse(routes)
})

export const POST = withErrorHandling(async (request) => {
  const input = savedRouteSchema.parse(await parseJsonBody(request))
  const saved = await savedRouteService.addSaved(getUserId(request), input)
  return successResponse(saved, 201)
})
