import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { distanceKm } from "@/lib/infra/geo"
import { estimatePrice } from "@/lib/infra/pricing"
import { combineDateAndTime, routeDepartsInWindow } from "@/lib/infra/schedule"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const template = await db.permanentRideRequest.findFirst({ where: { id, riderId, isActive: true } })
  if (!template) throw new AppError("Permanent request not found or cancelled", 404)
  const today = new Date()
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  if (!template.daysOfWeek.includes(today.getUTCDay())) {
    throw new AppError("This permanent request doesn't run today", 400)
  }
  const alreadyGenerated = await db.rideRequest.findFirst({
    where: { permanentRideRequestId: template.id, createdAt: { gte: todayStart } },
  })
  if (alreadyGenerated) {
    return successResponse(alreadyGenerated)
  }
  const windowStart = combineDateAndTime(todayStart, template.windowStartTime)
  const windowEnd = combineDateAndTime(todayStart, template.windowEndTime)
  const rideRequest = await db.rideRequest.create({
    data: {
      riderId,
      fromLabel: template.fromLabel,
      fromLat: template.fromLat,
      fromLng: template.fromLng,
      toLabel: template.toLabel,
      toLat: template.toLat,
      toLng: template.toLng,
      windowStart,
      windowEnd,
      groupSize: template.groupSize,
      vehiclePreference: template.vehiclePreference,
      permanentRideRequestId: template.id,
    },
  })
  if (!template.preferredDriverId) {
    return successResponse(rideRequest)
  }
  const preferredRoute = await db.route.findFirst({
    where: { driverId: template.preferredDriverId, status: "ACTIVE", seatsAvailable: { gte: template.groupSize } },
    include: { vehicle: true },
  })
  const preferredRouteWorks = preferredRoute &&
    routeDepartsInWindow(preferredRoute, windowStart, windowEnd) &&
    distanceKm(template.fromLat, template.fromLng, preferredRoute.fromLat, preferredRoute.fromLng) <=
      preferredRoute.detourLimitKm &&
    distanceKm(template.toLat, template.toLng, preferredRoute.toLat, preferredRoute.toLng) <=
      preferredRoute.detourLimitKm
  if (preferredRouteWorks && preferredRoute) {
    const tripDistanceKm = distanceKm(template.fromLat, template.fromLng, template.toLat, template.toLng)
    await db.match.create({
      data: {
        rideRequestId: rideRequest.id,
        routeId: preferredRoute.id,
        detourDistanceKm: 0,
        priceEstimate: estimatePrice(preferredRoute.vehicle.type, tripDistanceKm),
      },
    })
  }
  return successResponse(rideRequest)
})

/*
  the first preference will always be the prefer driver it even open to public
  fix window time to give 75 second reject/accept
  with a prefrerence routes for the route
*/