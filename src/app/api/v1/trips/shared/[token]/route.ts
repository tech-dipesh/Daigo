import { db } from "@/lib/infra/clients/db"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams<{ token: string }>>(async (_request, { params }) => {
  const { token } = await params
  const trip = await db.trip.findUnique({
    where: { shareToken: token },
    include: { route: { include: { vehicle: true } } },
  })
  if (!trip) {
    throw new AppError("This share link isn't valid", 404)
  }
  return successResponse({
    status: trip.status,
    vehicle: `${trip.route.vehicle.make} ${trip.route.vehicle.model}`,
    lastLat: trip.lastLat,
    lastLng: trip.lastLng,
    lastLocationAt: trip.lastLocationAt,
  })
})
