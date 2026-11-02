import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import * as driverService from "@/lib/services/driver/driver-service"
import { vehicleSchema } from "@/lib/validation/driver/driver-schema"

export const POST = withErrorHandling(async (request) => {
  const input = vehicleSchema.parse(await parseJsonBody(request))
  const vehicle = await driverService.addVehicle(getUserId(request), input)
  return successResponse(vehicle, 201)
})

export const GET = withErrorHandling(async (request) => {
  const vehicles = await driverService.listVehicles(getUserId(request))
  return successResponse(vehicles)
})
