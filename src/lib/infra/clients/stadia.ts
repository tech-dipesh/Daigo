import { env } from "@/lib/infra/clients/env"
import { redis } from "@/lib/infra/clients/redis"
import { distanceKm } from "@/lib/infra/matching/geo"

type Point = { lat: number; lng: number }
type RouteReply = { trip?: { summary?: { length: number; time: number } } }

const ttlSeconds = 60 * 60 * 24
const detourFactor = 1.3
const fallbackKmh = 30
const round = (n: number) => n.toFixed(3)

/*
  caching the rounded for the not burn credits
  for the fallback option
*/
export async function routeInfo(from: Point, to: Point) {
  const key = `route:${round(from.lat)},${round(from.lng)}:${round(to.lat)},${round(to.lng)}`
  try {
    const cached = await redis.get<{ km: number; minutes: number }>(key)
    if (cached) return cached
    const locations = [{ lat: from.lat, lon: from.lng }, { lat: to.lat, lon: to.lng }]
    const res = await fetch(`https://api.stadiamaps.com/route/v1?api_key=${env.STADIA_API}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locations, costing: "auto" }) })
    if (!res.ok) throw new Error(`stadia ${res.status}`)
    const body: RouteReply = await res.json()
    const summary = body.trip?.summary
    if (!summary) throw new Error("stadia sent no summary")
    const info = { km: summary.length, minutes: Math.round(summary.time / 60) }
    await redis.set(key, info, { ex: ttlSeconds })
    return info
  } catch (error) {
    console.error("route failed, using straight line", error)
    const km = distanceKm(from.lat, from.lng, to.lat, to.lng) * detourFactor
    return { km, minutes: Math.round((km / fallbackKmh) * 60) }
  }
}
