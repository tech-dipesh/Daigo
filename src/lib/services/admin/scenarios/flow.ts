import { forceExpire } from "@/lib/services/admin/demo-force-service"
import { acceptMatch } from "@/lib/services/ride/accept-service"
import { findMatches } from "@/lib/services/ride/matching-service"
import { createRequest, joinWaitlist } from "@/lib/services/ride/request-service"
import { payTrip } from "@/lib/services/payment/payment-service"
import { rateTrip } from "@/lib/services/trip/rating-service"
import * as paymentRepo from "@/lib/repository/payment/payment-repo"
import { bookTrip, finishTrip, requestFor, type Actors, type Rec } from "@/lib/services/admin/scenarios/kit"

export async function normalMatch({ riders, routes }: Actors, rec: Rec) {
  const [rider, route] = [riders[0], routes[2]]
  const booked = await bookTrip(rider, route, "normal-match", rec)
  if (!booked) return
  await finishTrip(route.driverId, booked.trip, rec)
  await payTrip(rider.id, booked.trip.id, { method: "ONLINE", redeemCoins: false, splitWith: [] })
  const payment = await paymentRepo.findByTrip(booked.trip.id)
  rec.add("rider paid online through the mock gateway", payment?.status === "PAID", { status: payment?.status })
  await rateTrip(rider.id, booked.trip.id, { score: 5, recommendTag: "PUNCTUAL" })
  rec.add("rider rated the driver", true)
}

export async function noDriver({ riders }: Actors, rec: Rec) {
  const rider = riders[1]
  const place = { fromLabel: "Gurugram Sector 29", fromLat: 28.4595, fromLng: 77.0266, toLabel: "Gurugram Cyber Hub", toLat: 28.495, toLng: 77.089 }
  const request = await createRequest(rider.id, requestFor(place, "no-driver", {}, 0))
  const found = await findMatches(rider.id, request.id)
  rec.add("no driver and no relay pair found", !found.direct.length && !found.relay.length, { direct: found.direct.length, relay: found.relay.length })
  await forceExpire({ requestId: request.id })
  const waiting = await joinWaitlist(rider.id, request.id)
  rec.add("expired request joined the waitlist", Boolean(waiting), { until: waiting.expiresAt })
}

/* routes 0 and 8 are twins in the seed, same trip so both drivers match */
export async function doubleAccept({ riders, routes }: Actors, rec: Rec) {
  const [rider, a, b] = [riders[2], routes[0], routes[8]]
  const request = await createRequest(rider.id, requestFor(a, "double-accept"))
  const found = await findMatches(rider.id, request.id)
  const [matchA, matchB] = [found.direct.find((m) => m.routeId === a.id), found.direct.find((m) => m.routeId === b.id)]
  rec.add("both twin drivers got the request", Boolean(matchA && matchB), { candidates: found.direct.length })
  if (!matchA || !matchB) return
  const results = await Promise.allSettled([acceptMatch(matchA.id), acceptMatch(matchB.id)])
  const winners = results.filter((r) => r.status === "fulfilled")
  const losers = results.map((r) => (r.status === "rejected" && r.reason instanceof Error ? r.reason.message : null))
  rec.add("both accepted at once, only one won", winners.length === 1, { winners: winners.length, loserSaid: losers.filter(Boolean) })
}
