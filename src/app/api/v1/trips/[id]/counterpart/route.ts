import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { distanceKm } from "@/lib/infra/matching/geo"
import type { RouteParams } from "@/types/api"

const driverRevealKm = 10
const photoRevealKm = 3

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  const full = await db.trip.findUniqueOrThrow({
    where: { id: trip.id },
    include: { rideRequest: true, rider: true, driver: true, route: { include: { vehicle: true } } },
  })
  /*
    once we reach a 10/3km radius reveal a identity
  */
  const proximityKm = full.status === "PENDING_PICKUP" && full.lastLat && full.lastLng
      ? distanceKm(full.lastLat, full.lastLng, full.rideRequest.fromLat, full.rideRequest.fromLng)
      : 0
  if (userId === full.driverId) {
    const rider = full.rider
    const firstName = rider.name?.split(" ")[0] ?? rider.email.split("@")[0]
    if (proximityKm > driverRevealKm) {
      return successResponse({ name: firstName, trustScore: rider.trustScore })
    }
    return successResponse({ name: rider.name ?? firstName, email: rider.email, trustScore: rider.trustScore })
  }
  const driver = full.driver
  const showPhoto = proximityKm <= photoRevealKm
  return successResponse({
    name: driver.name ?? driver.email.split("@")[0],
    trustScore: driver.trustScore,
    vehicle: `${full.route.vehicle.make} ${full.route.vehicle.model}`,
    profilePhotoUrl: showPhoto ? driver.profilePhotoUrl : null,
  })
})
