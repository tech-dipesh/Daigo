import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { distanceKm } from "@/lib/infra/matching/geo"
import * as routeRepo from "@/lib/repository/route-repo"
import * as tripRepo from "@/lib/repository/trip-repo"

const driverRevealKm = 10

const photoRevealKm = 3

/*
  same driver going back roughly where you came from counts as a return route -
   2km is loose on purpose, pickup spots are rarely the exact same pin twice
*/
const reverseRouteToleranceKm = 2

export async function counterpart(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  const full = await tripRepo.findWithPeople(trip.id)
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
      return { name: firstName, trustScore: rider.trustScore }
    }
    return { name: rider.name ?? firstName, email: rider.email, trustScore: rider.trustScore }
  }
  const driver = full.driver
  const showPhoto = proximityKm <= photoRevealKm
  return {
    name: driver.name ?? driver.email.split("@")[0],
    trustScore: driver.trustScore,
    vehicle: `${full.route.vehicle.make} ${full.route.vehicle.model}`,
    profilePhotoUrl: showPhoto ? driver.profilePhotoUrl : null,
  }
}

export async function returnSuggestion(riderId: string, id: string) {
  const trip = await tripRepo.findCompletedOwned(id, riderId)
  if (!trip) {
    throw new AppError("Completed trip not found", 404)
  }
  const sameDriverRoutes = await routeRepo.activeByDriver(trip.driverId)
  return sameDriverRoutes.filter((route) => {
    const startMatchesEnd = distanceKm(route.fromLat, route.fromLng, trip.rideRequest.toLat, trip.rideRequest.toLng)
    const endMatchesStart = distanceKm(route.toLat, route.toLng, trip.rideRequest.fromLat, trip.rideRequest.fromLng)
    return startMatchesEnd <= reverseRouteToleranceKm && endMatchesStart <= reverseRouteToleranceKm
  })
}
