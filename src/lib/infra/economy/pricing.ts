import { db } from "@/lib/infra/clients/db"
import { routeInfo } from "@/lib/infra/clients/stadia"
import { heavyRain, weatherMultiplier } from "@/lib/infra/clients/weather"
import { busyMultiplier, demandMultiplier } from "@/lib/infra/economy/demand"
import { zoneMultiplier } from "@/lib/infra/economy/zones"
import { minorPremium } from "@/lib/infra/economy/minor"

export type PriceInput = { fromLat: number; fromLng: number; toLat: number; toLng: number; when: Date; groupSize: number; minor?: boolean }

const maxPerKm = 40
const absoluteCap = 2000
const minFare = 8
const stackCap = 1.5
const groupDiscount = 0.85
const istOffsetMs = 5.5 * 60 * 60 * 1000
const fallbackRates: Record<string, number> = { BIKE: 7, SCOOTER: 8, AUTO: 12, CAR: 15, CAB: 18 }

export const hardCapFor = (km: number) => Math.min(Math.max(Math.round(maxPerKm * km), minFare), absoluteCap)

export function timeMultiplier(when: Date) {
  const hour = new Date(when.getTime() + istOffsetMs).getUTCHours()
  if (hour >= 22 || hour < 5) return 1.2
  if (hour >= 8 && hour < 10) return 1.05
  if (hour >= 17 && hour < 20) return 1.08
  return 1
}

/*
  caps check the rounded rupee value not the raw float
  else rounding can push it over the cap, ill recheck later
*/
export async function buildPricing(input: PriceInput) {
  const { fromLat, fromLng, toLat, toLng, when, groupSize, minor } = input
  const [route, pickup, drop, weather, demand, rateRows] = await Promise.all([
    routeInfo({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng }),
    zoneMultiplier(fromLat, fromLng),
    zoneMultiplier(toLat, toLng),
    weatherMultiplier(fromLat, fromLng),
    demandMultiplier(),
    db.fareRate.findMany(),
  ])
  const rates = new Map<string, number>(rateRows.map((r): [string, number] => [r.vehicleType, r.perKm]))
  const zone = (pickup.multiplier + drop.multiplier) / 2
  const time = timeMultiplier(when)
  const group = (groupSize > 1 ? groupDiscount : 1) * (minor ? minorPremium : 1)
  const stack = Math.min(time * weather * demand, stackCap)
  const worst = Math.min(time * heavyRain * busyMultiplier, stackCap)
  const priceAt = (baseRate: number, factor: number) => Math.min(Math.max(Math.round(Math.min(baseRate * zone * factor * group, maxPerKm) * route.km), minFare), absoluteCap)
  function quote(vehicleType: string) {
    const baseRate = rates.get(vehicleType) ?? fallbackRates[vehicleType] ?? maxPerKm
    const breakdown = { km: route.km, minutes: route.minutes, baseRate, zone, time, weather, demand, group }
    return { vehicleType, price: priceAt(baseRate, stack), low: priceAt(baseRate, time), high: priceAt(baseRate, worst), breakdown }
  }
  return { distanceKm: route.km, minutes: route.minutes, zones: { pickup: pickup.name, drop: drop.name }, quote }
}
