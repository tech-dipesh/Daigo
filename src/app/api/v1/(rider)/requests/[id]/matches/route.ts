import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { minorSafeRoutes } from "@/lib/infra/economy/minor"
import { tryAutoAccept } from "@/lib/infra/matching/auto-accept"
import { routeDepartsInWindow } from "@/lib/infra/matching/schedule"
import { findGeoCandidates } from "@/lib/infra/matching/postgis"
import { findRelayCandidates } from "@/lib/infra/matching/relay-matching"
import { vulnerableRequestTrustThreshold } from "@/lib/infra/economy/trust"
import { sameCircle } from "@/lib/infra/matching/circles"
import { isExpired } from "@/lib/infra/matching/expiry"
import { publishOnce } from "@/lib/infra/realtime/publish"
import type { RouteParams } from "@/types/api"
import * as userRepo from "@/lib/repository/user-repo"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const rideRequest = await db.rideRequest.findFirst({ where: { id, riderId } })
  if (!rideRequest) {
    throw new AppError("Ride request not found", 404)
  }
  if (isExpired(rideRequest.expiresAt)) throw new AppError("This request expired, retry it to search again", 410)
  const rider = await userRepo.getById(riderId)
  const { fromLat, fromLng, toLat, toLng, groupSize, windowStart } = rideRequest
  const pricing = await buildPricing({ fromLat, fromLng, toLat, toLng, groupSize, when: windowStart, minor: rideRequest.minorAge !== null })
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
  const routesSafe = rideRequest.minorAge === null ? routesTrustOk : await minorSafeRoutes(routesTrustOk)
  const scored = routesSafe.map((route) => {
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
            priceEstimate: pricing.quote(route.vehicle.type).price,
            distanceKm: pricing.distanceKm,
          },
          update: {},
          include: { route: { include: { vehicle: true } } },
        }),
      ),
    )
    const pending = matches.filter((m) => m.status === "PENDING")
    const auto = await tryAutoAccept(pending, rider.trustScore, pricing.distanceKm)
    if (auto) return successResponse({ direct: matches, relay: [], autoAccepted: { tripId: auto.trip.id } })
    const alerts = pending.map((m) => publishOnce(`alert:${m.id}`, m.route.driverId, "request.new", { matchId: m.id, requestId: rideRequest.id, from: rideRequest.fromLabel, to: rideRequest.toLabel, groupSize: rideRequest.groupSize, minorAge: rideRequest.minorAge, price: m.priceEstimate, expiresAt: rideRequest.expiresAt }))
    await Promise.all(alerts)
    return successResponse({ direct: matches, relay: [] })
  }
  /* no relay for kids, one driver the whole way */
  if (rideRequest.minorAge !== null) return successResponse({ direct: [], relay: [] })
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
          priceEstimate: pricing.quote(firstRoute.vehicle.type).price,
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
