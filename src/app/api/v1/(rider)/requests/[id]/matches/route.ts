import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { distanceKm } from "@/lib/infra/geo"
import { estimatePrice } from "@/lib/infra/pricing"

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

  const candidateRoutes = await db.route.findMany({
    where: {
      status: "ACTIVE",
      driverId: { not: riderId },
      seatsAvailable: { gte: rideRequest.groupSize },
      ...(rideRequest.vehiclePreference
        ? { vehicle: { type: rideRequest.vehiclePreference } }
        : {}),
    },
    include: { vehicle: true, driver: { select: { id: true } } },
  })

  const candidates = candidateRoutes.map((route) => {
      const pickupDistanceKm = distanceKm(
        rideRequest.fromLat,
        rideRequest.fromLng,
        route.fromLat,
        route.fromLng,
      )
      const dropoffDistanceKm = distanceKm(
        rideRequest.toLat,
        rideRequest.toLng,
        route.toLat,
        route.toLng,
      )

      return {
        route,
        detourDistanceKm: pickupDistanceKm + dropoffDistanceKm,
        withinLimit: pickupDistanceKm <= route.detourLimitKm && dropoffDistanceKm <= route.detourLimitKm,
      }
    })
    .filter(({ withinLimit }) => withinLimit)
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
