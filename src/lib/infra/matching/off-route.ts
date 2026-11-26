import { redis } from "@/lib/infra/clients/redis"
import { routeLine } from "@/lib/infra/clients/stadia"
import { deviationThresholdKm, distanceFromPathKm, distanceToLineKm, roadThresholdKm } from "@/lib/infra/matching/deviation"

type Ends = { fromLat: number; fromLng: number; toLat: number; toLng: number }

const strikesNeeded = 2
const strikeSeconds = 600

/*
  one bad gps point or a quick shortcut should not scare a rider
  so it takes two bad points in a row, a good point clears the count
   for this the without a road shape from stadia it falls back to the old straight line check
*/
export async function offRoute(tripId: string, lat: number, lng: number, route: Ends) {
  const { line, road } = await routeLine({ lat: route.fromLat, lng: route.fromLng }, { lat: route.toLat, lng: route.toLng })
  const away = road ? distanceToLineKm(lat, lng, line) > roadThresholdKm : distanceFromPathKm(lat, lng, route.fromLat, route.fromLng, route.toLat, route.toLng) > deviationThresholdKm
  const key = `dev:${tripId}`
  if (!away) {
    await redis.del(key)
    return false
  }
  const strikes = await redis.incr(key)
  await redis.expire(key, strikeSeconds)
  return strikes >= strikesNeeded
}
