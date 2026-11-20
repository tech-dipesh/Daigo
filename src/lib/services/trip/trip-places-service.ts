import { getTripForUser } from "@/lib/infra/auth/trip-access"
import * as tripPlacesRepo from "@/lib/repository/trip/trip-places-repo"

export async function tripPlaces(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  return tripPlacesRepo.placesOf(trip.rideRequestId)
}
