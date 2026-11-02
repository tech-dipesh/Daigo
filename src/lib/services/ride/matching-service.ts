import { AppError } from "@/lib/infra/http/response"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { minorSafeRoutes } from "@/lib/infra/economy/minor"
import { vulnerableRequestTrustThreshold } from "@/lib/infra/economy/trust"
import { sameCircle } from "@/lib/infra/matching/circles"
import { isExpired } from "@/lib/infra/matching/expiry"
import { findGeoCandidates } from "@/lib/infra/matching/postgis"
import { findRelayCandidates } from "@/lib/infra/matching/relay-matching"
import { routeDepartsInWindow } from "@/lib/infra/matching/schedule"
import { publishOnce } from "@/lib/infra/realtime/publish"
import { tryAutoAccept } from "@/lib/services/ride/accept-service"
import * as matchRepo from "@/lib/repository/ride/match-repo"
import * as relayRepo from "@/lib/repository/ride/relay-repo"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"
import * as routeRepo from "@/lib/repository/driver/route-repo"
import * as userRepo from "@/lib/repository/account/user-repo"

export async function findMatches(riderId: string, id: string) {
  const rideRequest = await rideRequestRepo.findOwned(id, riderId)
  if (!rideRequest) {
    throw new AppError("Ride request not found", 404)
  }
  if (isExpired(rideRequest.expiresAt)) throw new AppError("This request expired, retry it to search again", 410)
  const { fromLat, fromLng, toLat, toLng, groupSize, windowStart } = rideRequest
  const [rider, pricing, geoCandidates] = await Promise.all([
    userRepo.getById(riderId),
    buildPricing({ fromLat, fromLng, toLat, toLng, groupSize, when: windowStart, minor: rideRequest.minorAge !== null }),
    findGeoCandidates({ riderId, groupSize, fromLat, fromLng, toLat, toLng }),
  ])
  const distanceByRouteId = new Map(geoCandidates.map((c) => [c.id, c]))
  const directRoutes = geoCandidates.length ? await routeRepo.findForMatching(geoCandidates.map((c) => c.id), rideRequest.vehiclePreference) : []
  const routesInWindow = directRoutes.filter((route) => routeDepartsInWindow(route, rideRequest.windowStart, rideRequest.windowEnd))
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
        matchRepo.upsertCandidate({ rideRequestId: rideRequest.id, routeId: route.id, detourDistanceKm, priceEstimate: pricing.quote(route.vehicle.type).price, distanceKm: pricing.distanceKm }),
      ),
    )
    const pending = matches.filter((m) => m.status === "PENDING")
    const auto = await tryAutoAccept(pending, rider.trustScore, pricing.distanceKm)
    if (auto) return { direct: matches, relay: [], autoAccepted: { tripId: auto.trip.id } }
    const alerts = pending.map((m) => publishOnce(`alert:${m.id}`, m.route.driverId, "request.new", { matchId: m.id, requestId: rideRequest.id, from: rideRequest.fromLabel, to: rideRequest.toLabel, groupSize: rideRequest.groupSize, minorAge: rideRequest.minorAge, price: m.priceEstimate, expiresAt: rideRequest.expiresAt }))
    await Promise.all(alerts)
    return { direct: matches, relay: [] }
  }
  /* no relay for kids, one driver the whole way */
  if (rideRequest.minorAge !== null) return { direct: [], relay: [] }
  // nothing covers the whole trip on its own - see if two routes can hand the rider off
  const relayPairs = await findRelayCandidates(rideRequest)
  const relayMatches = await Promise.all(
    relayPairs.map(({ firstRoute, secondRoute, transferLat, transferLng }) =>
      relayRepo.upsertCandidate({ rideRequestId: rideRequest.id, firstRouteId: firstRoute.id, secondRouteId: secondRoute.id, transferLat, transferLng, priceEstimate: pricing.quote(firstRoute.vehicle.type).price }),
    ),
  )
  return { direct: [], relay: relayMatches }
}
