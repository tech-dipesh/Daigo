import { env } from "@/lib/infra/clients/env"
import { redis } from "@/lib/infra/clients/redis"

type WeatherReply = { weather?: { id: number }[] }

export const heavyRain = 1.2
const lightRain = 1.1
const heavyIds = [502, 503, 504, 511, 521, 522, 531]
const ttlSeconds = 60 * 15

function multiplierFor(id: number) {
  if (id < 300 || (id >= 600 && id < 700) || heavyIds.includes(id)) return heavyRain
  if (id < 600) return lightRain
  return 1
}

export async function weatherMultiplier(lat: number, lng: number) {
  if (!env.OWM_KEY) return 1
  const key = `weather:${lat.toFixed(1)}:${lng.toFixed(1)}`
  try {
    const cached = await redis.get<number>(key)
    if (cached !== null) return cached
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${env.OWM_KEY}`)
    if (!res.ok) return 1
    const body: WeatherReply = await res.json()
    const factor = multiplierFor(body.weather?.[0]?.id ?? 800)
    await redis.set(key, factor, { ex: ttlSeconds })
    return factor
  } catch (error) {
    console.error("weather failed, using 1", error)
    return 1
  }
}
