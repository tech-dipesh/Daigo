import { distanceKm } from "@/lib/infra/matching/geo"

export const implausibleSpeedKmh = 150
export const cancellationWindowHours = 24
export const cancellationGamingThreshold = 3
/*
  no real vehicle on the app setup hit the speed seupt for the jump this fast
  two reported point with a gps is being faked
*/
export function looksSpoofed( prevLat: number, prevLng: number, prevAt: Date, nextLat: number, nextLng: number, nextAt: Date, ) {
  const hoursElapsed = (nextAt.getTime() - prevAt.getTime()) / (1000 * 60 * 60)
  if (hoursElapsed <= 0) return false
  const impliedSpeedKmh = distanceKm(prevLat, prevLng, nextLat, nextLng) / hoursElapsed
  return impliedSpeedKmh > implausibleSpeedKmh
}