import * as matchInboxRepo from "@/lib/repository/ride/match-inbox-repo"

export async function listIncoming(driverId: string) {
  const rows = await matchInboxRepo.pendingForDriver(driverId)
  return rows.map(({ id, priceEstimate, detourDistanceKm, rideRequest, route }) => ({ id, price: priceEstimate, detourKm: detourDistanceKm, requestId: rideRequest.id, from: rideRequest.fromLabel, to: rideRequest.toLabel, groupSize: rideRequest.groupSize, isVulnerable: rideRequest.isVulnerable, expiresAt: rideRequest.expiresAt, routeId: route.id }))
}
