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

export const roadThresholdKm = 1
const kmPerLat = 110.57

/* flat local map around the point, good enough for a few km, then the nearest bit of every segment */
export function distanceToLineKm(lat: number, lng: number, line: [number, number][]) {
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180)
  const flat = ([x, y]: [number, number]) => [(x - lng) * kmPerLng, (y - lat) * kmPerLat] as const
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = flat(line[i - 1])
    const [bx, by] = flat(line[i])
    const dx = bx - ax
    const dy = by - ay
    const size = dx * dx + dy * dy
    const t = size === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / size))
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}
