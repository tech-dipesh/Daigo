import { randomBytes } from "node:crypto"
import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import * as tripRepo from "@/lib/repository/trip-repo"

export async function shareTrip(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  if (trip.shareToken) {
    return { shareToken: trip.shareToken }
  }
  const shareToken = randomBytes(16).toString("hex")
  await tripRepo.setShareToken(trip.id, shareToken)
  return { shareToken }
}

export async function sharedView(token: string) {
  const trip = await tripRepo.findBySharedToken(token)
  if (!trip) {
    throw new AppError("This share link isn't valid", 404)
  }
  return {
    status: trip.status,
    vehicle: `${trip.route.vehicle.make} ${trip.route.vehicle.model}`,
    lastLat: trip.lastLat,
    lastLng: trip.lastLng,
    lastLocationAt: trip.lastLocationAt,
  }
}
