import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { routeLine } from "@/lib/infra/clients/stadia"
import { routeLineSchema } from "@/lib/validation/map/route-schema"

export const GET = withErrorHandling(async (request) => {
  const { fromLat, fromLng, toLat, toLng } = routeLineSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const line = await routeLine({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng })
  return successResponse(line)
})
