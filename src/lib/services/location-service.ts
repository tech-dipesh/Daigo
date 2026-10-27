import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { looksSpoofed, spoofPenalty } from "@/lib/infra/economy/abuse"
import { issueWarning } from "@/lib/infra/economy/warnings"
import { deviationThresholdKm, distanceFromPathKm } from "@/lib/infra/matching/deviation"
import { etaMinutes } from "@/lib/infra/matching/eta"
import { distanceKm } from "@/lib/infra/matching/geo"
import { publishEvent } from "@/lib/infra/realtime/publish"
import * as routeRepo from "@/lib/repository/route-repo"
import * as tripRepo from "@/lib/repository/trip-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { LocationInput } from "@/lib/validation/trip-schema"

async function canViewTripLocation(
  trip: { id: string; riderId: string; driverId: string; relayMatchId: string | null; relayLeg: "FIRST" | "SECOND" | null },
  userId: string,
) {
  if (trip.riderId === userId || trip.driverId === userId) return true
  if (trip.relayMatchId && trip.relayLeg === "FIRST") {
    const siblingLeg = await tripRepo.findRelayLeg(trip.relayMatchId, "SECOND")
    if (siblingLeg?.driverId === userId) return true
  }
  return false
}

export async function postLocation(driverId: string, id: string, { lat, lng }: LocationInput) {
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can update location", 403)
  if (trip.status !== "PENDING_PICKUP" && trip.status !== "IN_PROGRESS") {
    throw new AppError("This trip isn't active", 409)
  }
  const { lastLat, lastLng, lastLocationAt } = trip
  if (lastLat != null && lastLng != null && lastLocationAt && looksSpoofed(lastLat, lastLng, lastLocationAt, lat, lng, new Date())) {
    await userRepo.adjustTrustNow(driverId, -spoofPenalty)
    await issueWarning(driverId, "GPS_SPOOF", "Your location jumped faster than a vehicle can travel", trip.id)
    throw new AppError("That location jump looks fake, update rejected", 422)
  }
  let isDeviated = false
  if (trip.status === "IN_PROGRESS") {
    const route = await routeRepo.getById(trip.routeId)
    const offPathKm = distanceFromPathKm(lat, lng, route.fromLat, route.fromLng, route.toLat, route.toLng)
    isDeviated = offPathKm > deviationThresholdKm
  }
  const updated = await tripRepo.saveLocation(trip.id, lat, lng, isDeviated)
  await publishEvent(trip.riderId, "trip.location", { tripId: trip.id, lat, lng, isDeviated })
  if (isDeviated && !trip.isDeviated) {
    const superAdmins = await userRepo.superAdmins()
    for (const admin of superAdmins) {
      await sendEmailBestEffort({
        to: admin.email,
        subject: "Trip route deviation detected",
        text: `Trip ${trip.id} has drifted more than ${deviationThresholdKm}km off its expected path.`,
      })
    }
  }
  return { lastLat: updated.lastLat, lastLng: updated.lastLng, lastLocationAt: updated.lastLocationAt, isDeviated: updated.isDeviated }
}

export async function getLocation(userId: string, id: string) {
  const trip = await tripRepo.findWithLocationContext(id)
  if (!trip || !(await canViewTripLocation(trip, userId))) {
    throw new AppError("Trip not found", 404)
  }
  if (!trip.lastLat || !trip.lastLng) {
    return { available: false }
  }
  const target =
    trip.status === "PENDING_PICKUP"
      ? { lat: trip.rideRequest.fromLat, lng: trip.rideRequest.fromLng }
      : { lat: trip.route.toLat, lng: trip.route.toLng }
  const remainingKm = distanceKm(trip.lastLat, trip.lastLng, target.lat, target.lng)
  return {
    available: true,
    lastLat: trip.lastLat,
    lastLng: trip.lastLng,
    lastLocationAt: trip.lastLocationAt,
    isDeviated: trip.isDeviated,
    remainingKm: Math.round(remainingKm * 10) / 10,
    etaMinutes: etaMinutes(remainingKm),
    driver: { email: trip.driver.email, vehicle: `${trip.route.vehicle.make} ${trip.route.vehicle.model}` },
  }
}
