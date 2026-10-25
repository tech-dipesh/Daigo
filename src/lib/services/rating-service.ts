import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { ratingDelta } from "@/lib/infra/economy/trust"
import { clearChat } from "@/lib/infra/realtime/chat"
import * as ratingRepo from "@/lib/repository/rating-repo"
import type { RatingInput } from "@/lib/validation/trip-schema"

export async function rateTrip(raterId: string, id: string, data: RatingInput) {
  const trip = await getTripForUser(id, raterId)
  if (trip.status !== "COMPLETED") {
    throw new AppError("You can only rate a completed trip", 409)
  }
  const alreadyRated = await ratingRepo.findByTripAndRater(trip.id, raterId)
  if (alreadyRated) {
    throw new AppError("You have already rated this trip", 409)
  }
  const ratedUserId = trip.riderId === raterId ? trip.driverId : trip.riderId
  const rating = await ratingRepo.createWithTrust({ ...data, tripId: trip.id, raterId, ratedUserId }, ratedUserId, ratingDelta(data.score))
  const ratingCount = await ratingRepo.countForTrip(trip.id)
  if (ratingCount >= 2) await clearChat(trip.id)
  return rating
}
