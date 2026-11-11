import { db } from "@/lib/infra/clients/db"
import { benchLabel } from "@/lib/infra/demo/bench-data"
import { isDemoMailbox } from "@/lib/infra/demo/config"

export const scenarioTag = "scenario:"

export async function actors(ids: string[]) {
  const [riders, routes] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids }, activeRole: "RIDER" }, orderBy: { email: "desc" } }),
    db.route.findMany({ where: { driverId: { in: ids }, fromLabel: { not: benchLabel } }, include: { vehicle: true, driver: true }, orderBy: { driver: { email: "asc" } } }),
  ])
  const demoRiders = riders.filter((rider) => isDemoMailbox(rider.email))
  return { riders: demoRiders, routes }
}

/* only rows made by a scenario go, children before parents */
export async function clearScenarios() {
  const requests = await db.rideRequest.findMany({ where: { notes: { startsWith: scenarioTag } }, select: { id: true } })
  const requestIds = requests.map((row) => row.id)
  const [trips, matches] = await Promise.all([
    db.trip.findMany({ where: { rideRequestId: { in: requestIds } }, select: { id: true } }),
    db.match.findMany({ where: { rideRequestId: { in: requestIds } }, select: { id: true } }),
  ])
  const trip = { in: trips.map((row) => row.id) }
  const matchIds = matches.map((row) => row.id)
  await db.$transaction([
    db.complaint.deleteMany({ where: { tripId: trip } }),
    db.paymentShare.deleteMany({ where: { payment: { tripId: trip } } }),
    db.payment.deleteMany({ where: { tripId: trip } }),
    db.rating.deleteMany({ where: { tripId: trip } }),
    db.emergencyEvent.deleteMany({ where: { tripId: trip } }),
    db.trip.deleteMany({ where: { id: trip } }),
    db.offer.deleteMany({ where: { matchId: { in: matchIds } } }),
    db.match.deleteMany({ where: { id: { in: matchIds } } }),
    db.relayMatch.deleteMany({ where: { rideRequestId: { in: requestIds } } }),
    db.waitlist.deleteMany({ where: { requestId: { in: requestIds } } }),
    db.rideRequest.deleteMany({ where: { id: { in: requestIds } } }),
  ])
  return requestIds.length
}

export const restoreRoutes = (routes: { id: string; vehicle: { seatCapacity: number } }[]) =>
  Promise.all(routes.map((route) => db.route.update({ where: { id: route.id }, data: { seatsAvailable: route.vehicle.seatCapacity, status: "ACTIVE" } })))

export const setTrust = (id: string, trustScore: number) => db.user.update({ where: { id }, data: { trustScore } })
export const ageTrip = (id: string, minutes: number) => db.trip.update({ where: { id }, data: { createdAt: new Date(Date.now() - minutes * 60000) } })
export const requestStatus = async (id: string) => (await db.rideRequest.findUniqueOrThrow({ where: { id }, select: { status: true } })).status
