export const benchLabel = "BENCH"

export type BenchVehicle = { id: string; ownerId: string; seatCapacity: number }

/* fixed seed so every benchmark run sees the same routes */
const rng = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function buildRoutes(count: number, vehicles: BenchVehicle[]) {
  const next = rng(33)
  const at = (min: number, span: number) => Number((min + next() * span).toFixed(5))
  return Array.from({ length: count }, (_, i) => {
    const { id, ownerId, seatCapacity } = vehicles[i % vehicles.length]
    return {
      driverId: ownerId, vehicleId: id, routeType: "REGULAR" as const, fromLabel: benchLabel, toLabel: benchLabel,
      fromLat: at(28, 5), fromLng: at(74, 4), toLat: at(28, 5), toLng: at(74, 4),
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], departureTime: new Date("1970-01-01T09:00:00Z"),
      detourLimitKm: Number((1 + next() * 19).toFixed(1)), seatsAvailable: seatCapacity,
    }
  })
}

const round = (n: number) => Math.round(n * 100) / 100

export function stats(ms: number[]) {
  const sorted = [...ms].sort((a, b) => a - b)
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
  return { p50: round(at(0.5)), p95: round(at(0.95)), avg: round(ms.reduce((sum, n) => sum + n, 0) / ms.length) }
}

export const points = [
  { fromLat: 30.7398, fromLng: 76.7827, toLat: 30.7046, toLng: 76.7179 },
  { fromLat: 30.6942, fromLng: 76.8606, toLat: 30.6425, toLng: 76.8173 },
  { fromLat: 30.901, fromLng: 75.8573, toLat: 30.7398, toLng: 76.7827 },
  { fromLat: 30.3782, fromLng: 76.7767, toLat: 30.746, toLng: 76.6469 },
]
