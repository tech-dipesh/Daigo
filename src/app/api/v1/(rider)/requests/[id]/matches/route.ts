import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { distanceKm } from "@/lib/infra/geo"
import { estimatePrice } from "@/lib/infra/pricing"
import { routeDepartsInWindow } from "@/lib/infra/schedule"
import { findGeoCandidates } from "@/lib/infra/postgis"
import { findRelayCandidates } from "@/lib/infra/relay-matching"
import { vulnerableRequestTrustThreshold } from "@/lib/infra/trust"
import { sameCircle } from "@/lib/infra/circles"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const rideRequest = await db.rideRequest.findFirst({ where: { id, riderId } })
  if (!rideRequest) {
    throw new AppError("Ride request not found", 404)
  }
  const rider = await db.user.findUniqueOrThrow({ where: { id: riderId } })
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
  const distanceByRouteId = new Map(geoCandidates.map((c) => [c.id, c]))
  const directRoutes = geoCandidates.length
    ? await db.route.findMany({
        where: {
          id: { in: geoCandidates.map((c) => c.id) },
          ...(rideRequest.vehiclePreference ? { vehicle: { type: rideRequest.vehiclePreference } } : {}),
        },
        include: { vehicle: true, driver: true },
      })
    : []
  const routesInWindow = directRoutes.filter((route) =>
    routeDepartsInWindow(route, rideRequest.windowStart, rideRequest.windowEnd),
  )
  /* a vulnerable rider only matches drivers who've actually earned trust */
  const routesTrustOk = rideRequest.isVulnerable
    ? routesInWindow.filter((route) => route.driver.trustScore >= vulnerableRequestTrustThreshold)
    : routesInWindow
  const scored = routesTrustOk.map((route) => {
    const distances = distanceByRouteId.get(route.id)
    const detourDistanceKm = (distances?.pickup_distance_km ?? 0) + (distances?.dropoff_distance_km ?? 0)
    const inCircle = sameCircle(rider.email, route.driver.email)
    return { route, detourDistanceKm, inCircle }
  })
  /* circles get first crack - same-domain drivers sort ahead of the open public pool */
  const directCandidates = scored.sort((a, b) => {
    if (a.inCircle !== b.inCircle) return a.inCircle ? -1 : 1
    return a.detourDistanceKm - b.detourDistanceKm
  })
  if (directCandidates.length) {
    const matches = await Promise.all(
      directCandidates.map(({ route, detourDistanceKm }) =>
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
    return successResponse({ direct: matches, relay: [] })
  }
  // nothing covers the whole trip on its own - see if two routes can hand the rider off
  const relayPairs = await findRelayCandidates(rideRequest)
  const relayMatches = await Promise.all(
    relayPairs.map(({ firstRoute, secondRoute, transferLat, transferLng }) =>
      db.relayMatch.upsert({
        where: {
          rideRequestId_firstRouteId_secondRouteId: {
            rideRequestId: rideRequest.id,
            firstRouteId: firstRoute.id,
            secondRouteId: secondRoute.id,
          },
        },
        create: {
          rideRequestId: rideRequest.id,
          firstRouteId: firstRoute.id,
          secondRouteId: secondRoute.id,
          transferLat,
          transferLng,
          priceEstimate: estimatePrice(firstRoute.vehicle.type, tripDistanceKm),
        },
        update: {},
        include: {
          firstRoute: { include: { vehicle: true } },
          secondRoute: { include: { vehicle: true } },
        },
      }),
    ),
  )
  return successResponse({ direct: [], relay: relayMatches })
})
