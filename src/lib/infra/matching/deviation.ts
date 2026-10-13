import { distanceKm } from "@/lib/infra/matching/geo"

export const deviationThresholdKm = 2
/*
  straigne placeholder rules for the stadia map
  with a segment clamped
  of the end measure rules.
*/
export function distanceFromPathKm(
  lat: number,
  lng: number,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) {
  const dx = endLat - startLat
  const dy = endLng - startLng
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return distanceKm(lat, lng, startLat, startLng)
  const t = ((lat - startLat) * dx + (lng - startLng) * dy) / lengthSquared
  const clampedT = Math.max(0, Math.min(1, t))
  const nearestLat = startLat + clampedT * dx
  const nearestLng = startLng + clampedT * dy
  return distanceKm(lat, lng, nearestLat, nearestLng)
}