import { AppError } from "@/lib/infra/http/response"
import { createRequest } from "@/lib/services/ride/request-service"
import * as savedRouteRepo from "@/lib/repository/ride/saved-route-repo"
import { rideRequestSchema } from "@/lib/validation/ride/request-schema"
import type { OneTapInput, SavedRouteInput } from "@/lib/validation/ride/saved-route-schema"

const maxSaved = 10

export const listSaved = (userId: string) => savedRouteRepo.list(userId)

export async function addSaved(userId: string, data: SavedRouteInput) {
  if ((await savedRouteRepo.count(userId)) >= maxSaved) throw new AppError(`You can save up to ${maxSaved} routes`, 409)
  return savedRouteRepo.create({ ...data, userId })
}

export async function removeSaved(userId: string, id: string) {
  const { count } = await savedRouteRepo.remove(id, userId)
  if (!count) throw new AppError("Saved route not found", 404)
  return { removed: true }
}

/* one tap: the saved trip turns into a normal request starting now */
export async function requestFromSaved(userId: string, id: string, { when, windowMinutes }: OneTapInput) {
  const saved = await savedRouteRepo.findOwned(id, userId)
  if (!saved) throw new AppError("Saved route not found", 404)
  const windowStart = when ?? new Date()
  const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000)
  const { fromLabel, fromLat, fromLng, toLabel, toLat, toLng, groupSize } = saved
  const input = rideRequestSchema.parse({ fromLabel, fromLat, fromLng, toLabel, toLat, toLng, groupSize, windowStart, windowEnd })
  return createRequest(userId, input)
}
