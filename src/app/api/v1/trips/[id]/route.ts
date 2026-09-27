import { getUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { getTripForUser } from "@/lib/infra/trip-access"

type RouteParams = { params: Promise<{ id: string }> }

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const { id } = await params

  const trip = await getTripForUser(id, userId)

  return successResponse(trip)
})
