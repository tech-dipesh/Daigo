import { AppError } from "@/lib/infra/http/response"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { isDemoAccount } from "@/lib/infra/demo/config"
import { acceptMatch } from "@/lib/services/ride/accept-service"
import * as matchRepo from "@/lib/repository/ride/match-repo"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"
import * as routeRepo from "@/lib/repository/driver/route-repo"
import * as tripRepo from "@/lib/repository/trip/trip-repo"
import type { ForceArrivalInput, ForceAssignInput, ForceExpireInput } from "@/lib/validation/admin/demo-schema"

/* the console only ever changes demo accounts, real users are refused */
function onlyDemo(...emails: string[]) {
  if (!emails.every(isDemoAccount)) throw new AppError("Only demo accounts can be changed from the console", 403)
}

async function loadRequest(id: string) {
  const request = await rideRequestRepo.findWithRider(id)
  if (!request) throw new AppError("Ride request not found", 404)
  return request
}

export async function forceAssign({ requestId, routeId }: ForceAssignInput) {
  const request = await loadRequest(requestId)
  const route = await routeRepo.findWithDriver(routeId)
  if (!route) throw new AppError("Route not found", 404)
  onlyDemo(request.rider.email, route.driver.email)
  if (request.status !== "PENDING") throw new AppError("This request is already decided", 409)
  await rideRequestRepo.setExpiry(requestId, null)
  const { fromLat, fromLng, toLat, toLng, groupSize, windowStart } = request
  const pricing = await buildPricing({ fromLat, fromLng, toLat, toLng, groupSize, when: windowStart })
  const price = pricing.quote(route.vehicle.type).price
  const match = await matchRepo.upsertCandidate({ rideRequestId: requestId, routeId, detourDistanceKm: 0, priceEstimate: price, distanceKm: pricing.distanceKm })
  const { trip } = await acceptMatch(match.id)
  return { tripId: trip.id, price, pickupOtp: trip.pickupOtp }
}

export async function forceExpire({ requestId }: ForceExpireInput) {
  const request = await loadRequest(requestId)
  onlyDemo(request.rider.email)
  const expired = await rideRequestRepo.setExpiry(requestId, new Date(Date.now() - 1000))
  return { requestId, expiresAt: expired.expiresAt }
}

/* pretends the driver arrived a while ago, so the 5 minute no-show wait is skipped */
export async function forceArrival({ tripId, minutesAgo }: ForceArrivalInput) {
  const trip = await tripRepo.findWithPeople(tripId)
  onlyDemo(trip.rider.email, trip.driver.email)
  const updated = await tripRepo.setArrivedAt(tripId, new Date(Date.now() - minutesAgo * 60 * 1000))
  return { tripId, arrivedAt: updated.arrivedAt }
}
