import { db } from "@/lib/infra/clients/db"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { distanceKm } from "@/lib/infra/matching/geo"
import { combineDateAndTime, routeDepartsInWindow } from "@/lib/infra/matching/schedule"
import { publishEvent } from "@/lib/infra/realtime/publish"

type Template = NonNullable<Awaited<ReturnType<typeof db.permanentRideRequest.findFirst>>>

/*
the utc is as of now correct which i think it'll run on the 6 am every day.
  utc day is fine here, job runs 6am ist which is 00:30 utc same date
*/
export async function generatePermanentRequest(template: Template) {
  const today = new Date()
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const done = await db.rideRequest.findFirst({ where: { permanentRideRequestId: template.id, createdAt: { gte: todayStart } } })
  if (done) return done
  const windowStart = combineDateAndTime(todayStart, template.windowStartTime)
  const windowEnd = combineDateAndTime(todayStart, template.windowEndTime)
  const rideRequest = await db.rideRequest.create({
    data: {
      riderId: template.riderId,
      fromLabel: template.fromLabel,
      fromLat: template.fromLat,
      fromLng: template.fromLng,
      toLabel: template.toLabel,
      toLat: template.toLat,
      toLng: template.toLng,
      windowStart,
      windowEnd,
      groupSize: template.groupSize,
      vehiclePreference: template.vehiclePreference,
      permanentRideRequestId: template.id,
    },
  })
  if (!template.preferredDriverId) return rideRequest
  const route = await db.route.findFirst({
    where: { driverId: template.preferredDriverId, status: "ACTIVE", seatsAvailable: { gte: template.groupSize } },
    include: { vehicle: true },
  })
  const fits = route && routeDepartsInWindow(route, windowStart, windowEnd) && distanceKm(template.fromLat, template.fromLng, route.fromLat, route.fromLng) <= route.detourLimitKm && distanceKm(template.toLat, template.toLng, route.toLat, route.toLng) <= route.detourLimitKm
  if (!route || !fits) return rideRequest
  const { fromLat, fromLng, toLat, toLng, groupSize } = template
  const pricing = await buildPricing({ fromLat, fromLng, toLat, toLng, groupSize, when: windowStart })
  const match = await db.match.create({
    data: { rideRequestId: rideRequest.id, routeId: route.id, detourDistanceKm: 0, priceEstimate: pricing.quote(route.vehicle.type).price, distanceKm: pricing.distanceKm },
  })
  await publishEvent(route.driverId, "request.new", { matchId: match.id, requestId: rideRequest.id, from: template.fromLabel, to: template.toLabel, groupSize, price: match.priceEstimate, expiresAt: null })
  return rideRequest
}

export async function autopostToday() {
  const day = new Date().getUTCDay()
  const templates = await db.permanentRideRequest.findMany({ where: { isActive: true, daysOfWeek: { has: day } } })
  for (const template of templates) {
    try {
      await generatePermanentRequest(template)
    } catch (error) {
      console.error("autopost failed for", template.id, error)
    }
  }
  console.log(`autopost done for ${templates.length} requests`)
}
