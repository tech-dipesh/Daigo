import { db } from "@/lib/infra/clients/db"
import { distanceKm } from "@/lib/infra/matching/geo"
import { routeDepartsInWindow } from "@/lib/infra/matching/schedule"
import { notify } from "@/lib/infra/realtime/notify"

export const waitlistHours = 24

type NewRoute = {
  driverId: string
  status: string
  seatsAvailable: number
  detourLimitKm: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  routeType: "REGULAR" | "ADVANCE"
  daysOfWeek: number[]
  departureDate: Date | null
  departureTime: Date
}

type WaitingRequest = {
  riderId: string
  groupSize: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  windowStart: Date
  windowEnd: Date
}

/*
  rough check only, retry does the real matching
  the old window is shifted forward like retry does
*/
function routeFitsRequest(route: NewRoute, request: WaitingRequest) {
  if (route.status !== "ACTIVE" || route.seatsAvailable < request.groupSize || route.driverId === request.riderId) return false
  const pickupGap = distanceKm(request.fromLat, request.fromLng, route.fromLat, route.fromLng)
  const dropGap = distanceKm(request.toLat, request.toLng, route.toLat, route.toLng)
  if (pickupGap > route.detourLimitKm || dropGap > route.detourLimitKm) return false
  const length = request.windowEnd.getTime() - request.windowStart.getTime()
  const start = new Date(Math.max(request.windowStart.getTime(), Date.now()))
  return routeDepartsInWindow(route, start, new Date(start.getTime() + length))
}

export async function notifyWaitlist(route: NewRoute) {
  try {
    const waiting = await db.waitlist.findMany({ where: { status: "WAITING", expiresAt: { gt: new Date() } }, take: 100 })
    if (!waiting.length) return
    const requests = await db.rideRequest.findMany({ where: { id: { in: waiting.map((w) => w.requestId) } } })
    const fits = requests.filter((r) => routeFitsRequest(route, r))
    const jobs = fits.map(async (r) => {
      await db.waitlist.update({ where: { requestId: r.id }, data: { status: "NOTIFIED", notifiedAt: new Date() } })
      await notify(r.riderId, "WAITLIST", "A driver is going your way", "A new route matches your waitlisted request. Retry it to see the match.", { requestId: r.id })
    })
    await Promise.all(jobs)
  } catch (error) {
    console.error("waitlist notify failed", error)
  }
}
