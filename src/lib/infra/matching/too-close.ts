import { AppError } from "@/lib/infra/http/response"
import { distanceKm } from "@/lib/infra/matching/geo"

export const minMeters = 100

export function assertApart({ fromLat, fromLng, toLat, toLng }: { fromLat: number; fromLng: number; toLat: number; toLng: number }) {
  if (distanceKm(fromLat, fromLng, toLat, toLng) * 1000 < minMeters) throw new AppError("Pickup and drop are too close, keep them at least 100 metres apart", 422)
}
