import { randomUUID } from "node:crypto"
import type { Plan } from "@/lib/repository/admin/demo-seed-repo"
import { demoDomain } from "@/lib/infra/demo/config"

export type DemoSize = "full" | "quick"

const sizes = { full: { riders: 40, drivers: 20, trips: 5 }, quick: { riders: 20, drivers: 10, trips: 3 } }
const kinds = [
  { type: "CAR", make: "Maruti", model: "Swift", seats: 4 },
  { type: "BIKE", make: "Hero", model: "Splendor", seats: 1 },
  { type: "AUTO", make: "Bajaj", model: "RE", seats: 3 },
  { type: "CAB", make: "Toyota", model: "Etios", seats: 4 },
  { type: "SCOOTER", make: "Honda", model: "Activa", seats: 1 },
] as const
const places = [
  { label: "Chandigarh Sector 17", lat: 30.7398, lng: 76.7827 },
  { label: "Mohali Phase 7", lat: 30.7046, lng: 76.7179 },
  { label: "Panchkula Sector 5", lat: 30.6942, lng: 76.8606 },
  { label: "Zirakpur", lat: 30.6425, lng: 76.8173 },
  { label: "Kharar", lat: 30.7460, lng: 76.6469 },
  { label: "Ambala City", lat: 30.3782, lng: 76.7767 },
  { label: "Ludhiana", lat: 30.9010, lng: 75.8573 },
  { label: "Shimla Mall Road", lat: 31.1048, lng: 77.1734 },
] as const

const pad = (n: number) => String(n).padStart(2, "0")
const nudge = (n: number, i: number) => Number((n + ((i % 5) - 2) * 0.002).toFixed(5))

export function buildPlan(size: DemoSize, passwordHash: string, liveEmail: string | undefined, now = new Date()): Plan {
  const { riders, drivers, trips } = sizes[size]
  /*
    Id's are the made here with row can point the parent
  */
  const person = (email: string, name: string, activeRole: "RIDER" | "DRIVER", trustScore: number) => ({ id: randomUUID(), email, name, passwordHash, activeRole, trustScore, emailVerifiedAt: now })
  const riderRows = Array.from({ length: riders }, (_, i) => person(`rider${pad(i + 1)}${demoDomain}`, `Rider ${pad(i + 1)}`, "RIDER", 70 + ((i * 7) % 30)))
  if (liveEmail) riderRows.push(person(liveEmail, "Live Demo", "RIDER", 100))
  const driverRows = Array.from({ length: drivers }, (_, i) => person(`driver${pad(i + 1)}${demoDomain}`, `Driver ${pad(i + 1)}`, "DRIVER", 85 + ((i * 3) % 15)))
  const vehicles = driverRows.map((d, i) => ({ id: randomUUID(), ownerId: d.id, ...kinds[i % kinds.length], seatCapacity: kinds[i % kinds.length].seats, plateNumber: `DEMO-${pad(i + 1)}`, rcNumber: `RC-DEMO-${pad(i + 1)}`, verificationStatus: "APPROVED" as const, reviewedAt: now }))
  const documents = driverRows.map((d, i) => ({ id: randomUUID(), userId: d.id, licenseNumber: `DL-DEMO-${pad(i + 1)}`, verificationStatus: "APPROVED" as const, reviewedAt: now }))
  const routes = driverRows.map((d, i) => {
    const from = places[i % places.length]
    const to = places[(i + 3) % places.length]
    return { id: randomUUID(), driverId: d.id, vehicleId: vehicles[i].id, routeType: "REGULAR" as const, fromLabel: from.label, fromLat: from.lat, fromLng: from.lng, toLabel: to.label, toLat: to.lat, toLng: to.lng, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], departureTime: new Date(`1970-01-01T${pad(8 + (i % 3))}:${pad((i * 10) % 60)}:00Z`), detourLimitKm: 4, seatsAvailable: vehicles[i].seatCapacity }
  })
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const windowEnd = new Date(dayStart.getTime() + 2 * 24 * 60 * 60 * 1000)
  const request = (riderId: string, route: (typeof routes)[number], i: number, status: "PENDING" | "MATCHED") => ({
    id: randomUUID(), riderId, status, fromLabel: route.fromLabel, fromLat: nudge(route.fromLat, i), fromLng: nudge(route.fromLng, i), toLabel: route.toLabel, toLat: nudge(route.toLat, i + 1), toLng: nudge(route.toLng, i + 1), windowStart: dayStart, windowEnd, groupSize: 1,
  })
  const open = riderRows.slice(0, Math.round(riders * 0.75)).map((r, i) => request(r.id, routes[i % routes.length], i, "PENDING"))
  const done = Array.from({ length: trips }, (_, k) => ({ rider: riderRows[open.length + k], route: routes[k], driver: driverRows[k] }))
  const doneRequests = done.map((d, k) => request(d.rider.id, d.route, k, "MATCHED"))
  const tripRows = done.map((d, k) => ({ id: randomUUID(), rideRequestId: doneRequests[k].id, routeId: d.route.id, riderId: d.rider.id, driverId: d.driver.id, status: "COMPLETED" as const, priceEstimate: 120 + k * 30, distanceKm: 9 + k, pickupOtp: "000000", otpVerifiedAt: new Date(now.getTime() - (k + 2) * 3600000), completedAt: new Date(now.getTime() - (k + 1) * 3600000) }))
  const ratings = tripRows.flatMap((t, k) => [
    { id: randomUUID(), tripId: t.id, raterId: t.riderId, ratedUserId: t.driverId, score: 4 + (k % 2) },
    { id: randomUUID(), tripId: t.id, raterId: t.driverId, ratedUserId: t.riderId, score: 5 },
  ])
  const payments = tripRows.map((t, k) => ({ id: randomUUID(), tripId: t.id, amount: t.priceEstimate, method: "ONLINE" as const, status: "PAID" as const, gatewayRef: `mock_demo_${k}`, coinsRedeemed: 0, paidAt: t.completedAt }))
  return { users: [...riderRows, ...driverRows], vehicles, documents, routes, requests: [...open, ...doneRequests], trips: tripRows, ratings, payments }
}
