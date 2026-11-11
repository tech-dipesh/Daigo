import { acceptMatch } from "@/lib/services/ride/accept-service"
import { findMatches } from "@/lib/services/ride/matching-service"
import { createRequest } from "@/lib/services/ride/request-service"
import * as tripService from "@/lib/services/trip/trip-service"
import * as tripRepo from "@/lib/repository/trip/trip-repo"
import { scenarioTag, type actors } from "@/lib/repository/admin/scenario-repo"
import { rideRequestSchema } from "@/lib/validation/ride/request-schema"

export type Actors = Awaited<ReturnType<typeof actors>>
export type Route = Actors["routes"][number]
export type Rider = Actors["riders"][number]
export type Step = { step: string; ok: boolean; detail?: unknown }
type Place = { fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number }

export function recorder() {
  const steps: Step[] = []
  const add = (step: string, ok: boolean, detail?: unknown) => steps.push({ step, ok, detail })
  return { steps, add }
}

export type Rec = ReturnType<typeof recorder>

export function requestFor(place: Place, tag: string, extra: Record<string, unknown> = {}, nudge = 0.0007) {
  const now = new Date()
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const windowEnd = new Date(windowStart.getTime() + 2 * 24 * 60 * 60 * 1000)
  const { fromLat, fromLng, toLat, toLng, fromLabel, toLabel } = place
  return rideRequestSchema.parse({ fromLabel, toLabel, fromLat: fromLat + nudge, fromLng: fromLng + nudge, toLat: toLat + nudge, toLng: toLng + nudge, windowStart, windowEnd, notes: `${scenarioTag}${tag}`, ...extra })
}

export async function bookTrip(rider: Rider, route: Route, tag: string, rec: Rec) {
  const request = await createRequest(rider.id, requestFor(route, tag))
  const found = await findMatches(rider.id, request.id)
  const match = found.direct.find((m) => m.routeId === route.id)
  rec.add("matching found the driver", Boolean(match), { candidates: found.direct.length })
  if (!match) return null
  const { trip } = await acceptMatch(match.id)
  rec.add("driver accepted and a trip was made", true, { tripId: trip.id, otp: trip.pickupOtp, price: trip.priceEstimate })
  return { request, trip }
}

export async function startTrip(driverId: string, trip: { id: string; pickupOtp: string }, rec: Rec) {
  await tripService.markArrived(driverId, trip.id)
  await tripService.verifyPickup(driverId, trip.id, { otp: trip.pickupOtp })
  const { status } = await tripRepo.findWithPeople(trip.id)
  rec.add("driver arrived and the pickup code worked", status === "IN_PROGRESS", { status })
}

export async function finishTrip(driverId: string, trip: { id: string; pickupOtp: string }, rec: Rec) {
  await startTrip(driverId, trip, rec)
  await tripService.completeTrip(driverId, trip.id)
  const { status } = await tripRepo.findWithPeople(trip.id)
  rec.add("trip completed", status === "COMPLETED", { status })
}
