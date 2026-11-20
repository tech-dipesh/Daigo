import { routeInfo } from "@/lib/infra/clients/stadia"
import { hardCapFor } from "@/lib/infra/economy/pricing"

type MatchForBounds = { priceEstimate: number; rideRequest: { fromLat: number; fromLng: number; toLat: number; toLng: number } }

export const maxRounds = 3
export const offerWindowSeconds = 300
const lowFactor = 0.8
const highFactor = 1.3

/*
  last round is the urgent one, up to the hard cap
  so the driver has a real reason to say yes
*/
export async function offerBounds(match: MatchForBounds, round: number) {
  const { fromLat, fromLng, toLat, toLng } = match.rideRequest
  const route = await routeInfo({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng })
  const hardCap = hardCapFor(route.km)
  const low = Math.round(match.priceEstimate * lowFactor)
  const high = round >= maxRounds ? hardCap : Math.min(Math.round(match.priceEstimate * highFactor), hardCap)
  return { low, high, hardCap }
}
