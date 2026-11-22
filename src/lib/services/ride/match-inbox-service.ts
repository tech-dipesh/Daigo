import { AppError } from "@/lib/infra/http/response"
import * as matchInboxRepo from "@/lib/repository/ride/match-inbox-repo"
import * as relayRepo from "@/lib/repository/ride/relay-repo"
import type { RelayForDriver } from "@/lib/repository/ride/relay-repo"

type RelayRow = RelayForDriver | Awaited<ReturnType<typeof relayRepo.pendingForDriver>>[number]

/* the driver only ever sees their own half, never the other driver's route or contact */
function relayView(relay: RelayRow, driverId: string) {
  const first = relay.firstRoute.driverId === driverId
  const mine = first ? relay.firstRoute : relay.secondRoute
  const { rideRequest: req } = relay
  const other = first ? relay.secondLegStatus : relay.firstLegStatus
  return { id: relay.id, leg: first ? "FIRST" : "SECOND", status: relay.status, myStatus: first ? relay.firstLegStatus : relay.secondLegStatus, otherAccepted: other === "ACCEPTED", price: relay.priceEstimate, from: req.fromLabel, to: req.toLabel, groupSize: req.groupSize, transfer: { lat: relay.transferLat, lng: relay.transferLng }, route: { from: mine.fromLabel, to: mine.toLabel, departureTime: mine.departureTime }, expiresAt: req.expiresAt }
}

export async function listIncomingRelays(driverId: string) {
  const rows = await relayRepo.pendingForDriver(driverId)
  return rows.map((row) => relayView(row, driverId))
}

export async function getRelay(driverId: string, id: string) {
  const relay = await relayRepo.findForDriver(id, driverId)
  if (!relay) throw new AppError("Relay match not found", 404)
  return relayView(relay, driverId)
}

export async function listIncoming(driverId: string) {
  const rows = await matchInboxRepo.pendingForDriver(driverId)
  return rows.map(({ id, priceEstimate, detourDistanceKm, rideRequest, route }) => ({ id, price: priceEstimate, detourKm: detourDistanceKm, requestId: rideRequest.id, from: rideRequest.fromLabel, to: rideRequest.toLabel, groupSize: rideRequest.groupSize, isVulnerable: rideRequest.isVulnerable, expiresAt: rideRequest.expiresAt, routeId: route.id }))
}
