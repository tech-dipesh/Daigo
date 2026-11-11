import { triggerEmergency } from "@/lib/services/safety/safety-service"
import { fileComplaint } from "@/lib/services/safety/support-service"
import { findMatches } from "@/lib/services/ride/matching-service"
import { createRequest } from "@/lib/services/ride/request-service"
import { payTrip } from "@/lib/services/payment/payment-service"
import { cancelTrip } from "@/lib/services/trip/trip-service"
import { vulnerableRequestTrustThreshold } from "@/lib/infra/economy/trust"
import * as paymentRepo from "@/lib/repository/payment/payment-repo"
import * as scenarioRepo from "@/lib/repository/admin/scenario-repo"
import * as userRepo from "@/lib/repository/account/user-repo"
import { bookTrip, finishTrip, requestFor, startTrip, type Actors, type Rec } from "@/lib/services/admin/scenarios/kit"

export async function emergency({ riders, routes }: Actors, rec: Rec) {
  // With a Trip left running show a alert
  const [rider, route] = [riders[3], routes[3]]
  const booked = await bookTrip(rider, route, "emergency", rec)
  if (!booked) return
  await startTrip(route.driverId, booked.trip, rec)
  const event = await triggerEmergency(rider.id, { tripId: booked.trip.id, lat: route.fromLat, lng: route.fromLng })
  rec.add("emergency raised, admins get a live event and a mail", Boolean(event.id), { eventId: event.id })
}

export async function cancelAfterAccept({ riders, routes }: Actors, rec: Rec) {
  const [rider, route] = [riders[4], routes[4]]
  const booked = await bookTrip(rider, route, "cancel-after-accept", rec)
  if (!booked) return
  await scenarioRepo.ageTrip(booked.trip.id, 90)
  const before = (await userRepo.getById(route.driverId)).trustScore
  await cancelTrip(route.driverId, booked.trip.id, { reason: "demo late cancel" })
  const after = (await userRepo.getById(route.driverId)).trustScore
  const reopened = await scenarioRepo.requestStatus(booked.request.id)
  rec.add("late driver cancel cost trust, request reopened", after < before && reopened === "PENDING", { before, after, request: reopened })
  await scenarioRepo.setTrust(route.driverId, before)
}

/*
  rider says cash was paid, driver never confirms, 
  it lands in the complaint queue
*/
export async function paymentMismatch({ riders, routes }: Actors, rec: Rec) {
  const [rider, route] = [riders[5], routes[5]]
  const booked = await bookTrip(rider, route, "payment-mismatch", rec)
  if (!booked) return
  await finishTrip(route.driverId, booked.trip, rec)
  await payTrip(rider.id, booked.trip.id, { method: "CASH", redeemCoins: false, splitWith: [] })
  const payment = await paymentRepo.findByTrip(booked.trip.id)
  rec.add("cash payment stays pending", payment?.status === "PENDING", { status: payment?.status })
  const text = "Driver says the cash never arrived but I paid at drop off"
  const complaint = await fileComplaint(rider.id, { tripId: booked.trip.id, type: "PAYMENT", text })
  rec.add("complaint is open in the admin queue", complaint.status === "OPEN", { complaintId: complaint.id })
}

/*
  route 9 driver gets low trust for a moment
  vulnerable
  request must skip him
*/
export async function vulnerableRequest({ riders, routes }: Actors, rec: Rec) {
  const [rider, safe, risky] = [riders[6], routes[1], routes[9]]
  const original = risky.driver.trustScore
  await scenarioRepo.setTrust(risky.driverId, vulnerableRequestTrustThreshold - 25)
  try {
    const request = await createRequest(rider.id, requestFor(safe, "vulnerable-request", { isVulnerable: true }))
    const found = await findMatches(rider.id, request.id)
    const ids = found.direct.map((m) => m.routeId)
    rec.add("only the high trust driver matched", ids.includes(safe.id) && !ids.includes(risky.id), { matched: ids.length, threshold: vulnerableRequestTrustThreshold })
  } finally {
    await scenarioRepo.setTrust(risky.driverId, original)
  }
}
