import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import * as tripService from "@/lib/services/trip/trip-service"

export const GET = withErrorHandling(async (request) => {
  const trips = await tripService.listTrips(getUserId(request))
  return successResponse(trips)
})
