import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { idFrom } from "@/lib/infra/route-params"
import { getTripForUser } from "@/lib/infra/trip-access"
import { distanceKm } from "@/lib/infra/geo"
import type { RouteParams } from "@/types/api"

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})
/*
  the real routing is not yet build
  with the assumption with the placeholder on this i've used
*/
const assumedSpeedKmh = 25
async function canViewTripLocation(
  trip: { id: string; riderId: string; driverId: string; relayMatchId: string | null; relayLeg: "FIRST" | "SECOND" | null },
  userId: string,
) {
  if (trip.riderId === userId || trip.driverId === userId) return true
  if (trip.relayMatchId && trip.relayLeg === "FIRST") {
    const siblingLeg = await db.trip.findFirst({
      where: { relayMatchId: trip.relayMatchId, relayLeg: "SECOND" },
    })
    if (siblingLeg?.driverId === userId) return true
  }
  return false
}

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can update location", 403)
  if (trip.status !== "PENDING_PICKUP" && trip.status !== "IN_PROGRESS") {
    throw new AppError("This trip isn't active", 409)
  }
  const { lat, lng } = locationSchema.parse(await parseJsonBody(request))
  const updated = await db.trip.update({
    where: { id: trip.id },
    data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
  })
  return successResponse({
    lastLat: updated.lastLat,
    lastLng: updated.lastLng,
    lastLocationAt: updated.lastLocationAt,
  })
})

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await db.trip.findUnique({
    where: { id },
    include: { rideRequest: true, route: { include: { vehicle: true } }, driver: true },
  })
  if (!trip || !(await canViewTripLocation(trip, userId))) {
    throw new AppError("Trip not found", 404)
  }
  if (!trip.lastLat || !trip.lastLng) {
    return successResponse({ available: false })
  }
  const target =
    trip.status === "PENDING_PICKUP"
      ? { lat: trip.rideRequest.fromLat, lng: trip.rideRequest.fromLng }
      : { lat: trip.route.toLat, lng: trip.route.toLng }
  const remainingKm = distanceKm(trip.lastLat, trip.lastLng, target.lat, target.lng)
  return successResponse({
    available: true,
    lastLat: trip.lastLat,
    lastLng: trip.lastLng,
    lastLocationAt: trip.lastLocationAt,
    remainingKm: Math.round(remainingKm * 10) / 10,
    etaMinutes: Math.round((remainingKm / assumedSpeedKmh) * 60),
    driver: { email: trip.driver.email, vehicle: `${trip.route.vehicle.make} ${trip.route.vehicle.model}` },
  })
})
