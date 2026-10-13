import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { distanceKm } from "@/lib/infra/matching/geo"
import type { RouteParams } from "@/types/api"

/*
same driver going back roughly where you came from counts as a return route -
   2km is loose on purpose, pickup spots are rarely the exact same pin twice
*/
const reverseRouteToleranceKm = 2

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const trip = await db.trip.findFirst({
    where: { id, riderId, status: "COMPLETED" },
    include: { rideRequest: true },
  })
  if (!trip) {
    throw new AppError("Completed trip not found", 404)
  }
  const sameDriverRoutes = await db.route.findMany({
    where: { driverId: trip.driverId, status: "ACTIVE" },
    include: { vehicle: true },
  })
  const reverseRoutes = sameDriverRoutes.filter((route) => {
    const startMatchesEnd = distanceKm(route.fromLat, route.fromLng, trip.rideRequest.toLat, trip.rideRequest.toLng)
    const endMatchesStart = distanceKm(route.toLat, route.toLng, trip.rideRequest.fromLat, trip.rideRequest.fromLng)
    return startMatchesEnd <= reverseRouteToleranceKm && endMatchesStart <= reverseRouteToleranceKm
  })
  return successResponse(reverseRoutes)
})
