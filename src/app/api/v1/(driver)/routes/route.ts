import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as driverService from "@/lib/services/driver/driver-service"
import { routeSchema } from "@/lib/validation/driver/driver-schema"

export const GET = withErrorHandling(async (request) => {
  const routes = await driverService.listRoutes(getUserId(request))
  return successResponse(routes)
})

export const POST = withErrorHandling(async (request) => {
  const input = routeSchema.parse(await parseJsonBody(request))
  const route = await driverService.createRoute(getUserId(request), input)
  return successResponse(route, 201)
})
