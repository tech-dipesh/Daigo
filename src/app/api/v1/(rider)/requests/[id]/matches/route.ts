import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { distanceKm } from "@/lib/infra/geo"
import { estimatePrice } from "@/lib/infra/pricing"
import { routeDepartsInWindow } from "@/lib/infra/schedule"
import { findGeoCandidates } from "@/lib/infra/postgis"

type RouteParams = { params: Promise<{ id: string }> }

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)

  const rideRequest = await db.rideRequest.findFirst({ where: { id, riderId } })

  if (!rideRequest) {
    throw new AppError("Ride request not found", 404)
  }

  const tripDistanceKm = distanceKm(
    rideRequest.fromLat,
    rideRequest.fromLng,
    rideRequest.toLat,
    rideRequest.toLng,
  )

  const geoCandidates = await findGeoCandidates({
    riderId,
    groupSize: rideRequest.groupSize,
    fromLat: rideRequest.fromLat,
    fromLng: rideRequest.fromLng,
    toLat: rideRequest.toLat,
    toLng: rideRequest.toLng,
  })

  if (!geoCandidates.length) {
    return successResponse([])
  }

  const distanceByRouteId = new Map(geoCandidates.map((c) => [c.id, c]))

  const routes = await db.route.findMany({
    where: {
      id: { in: geoCandidates.map((c) => c.id) },
      ...(rideRequest.vehiclePreference ? { vehicle: { type: rideRequest.vehiclePreference } } : {}),
    },
    include: { vehicle: true },
  })

  const candidates = routes
    .filter((route) => routeDepartsInWindow(route, rideRequest.windowStart, rideRequest.windowEnd))
    .map((route) => {
      const distances = distanceByRouteId.get(route.id)
      return {
        route,
        detourDistanceKm: (distances?.pickup_distance_km ?? 0) + (distances?.dropoff_distance_km ?? 0),
      }
    })
    .sort((a, b) => a.detourDistanceKm - b.detourDistanceKm)

  const created = await Promise.all(
    candidates.map(({ route, detourDistanceKm }) =>
      db.match.upsert({
        where: { rideRequestId_routeId: { rideRequestId: rideRequest.id, routeId: route.id } },
        create: {
          rideRequestId: rideRequest.id,
          routeId: route.id,
          detourDistanceKm,
          priceEstimate: estimatePrice(route.vehicle.type, tripDistanceKm),
        },
        update: {},
        include: { route: { include: { vehicle: true } } },
      }),
    ),
  )

  return successResponse(created)
})
