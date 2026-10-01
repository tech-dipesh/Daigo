import { db } from "@/lib/infra/db"
import { distanceKm } from "@/lib/infra/geo"
import { routeDepartsInWindow } from "@/lib/infra/schedule"

const transferRadiusKm = 3

type RideRequestForRelay = {
  riderId: string
  groupSize: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  windowStart: Date
  windowEnd: Date
}

export async function findRelayCandidates(rideRequest: RideRequestForRelay) {
  // relay must have the car no 
  const needsCar = rideRequest.groupSize > 1

  const activeRoutes = await db.route.findMany({
    where: {
      status: "ACTIVE",
      driverId: { not: rideRequest.riderId },
      seatsAvailable: { gte: rideRequest.groupSize },
      ...(needsCar ? { vehicle: { type: "CAR" } } : {}),
    },
    include: { vehicle: true },
  })

  const inWindow = activeRoutes.filter((route) =>
    routeDepartsInWindow(route, rideRequest.windowStart, rideRequest.windowEnd),
  )

  const firstLegs = inWindow.filter(
    (route) =>
      distanceKm(rideRequest.fromLat, rideRequest.fromLng, route.fromLat, route.fromLng) <=
      route.detourLimitKm,
  )

  const secondLegs = inWindow.filter(
    (route) =>
      distanceKm(rideRequest.toLat, rideRequest.toLng, route.toLat, route.toLng) <= route.detourLimitKm,
  )

  const pairs = []

  for (const firstRoute of firstLegs) {
    for (const secondRoute of secondLegs) {
      if (firstRoute.id === secondRoute.id) continue

      const transferGapKm = distanceKm(
        firstRoute.toLat,
        firstRoute.toLng,
        secondRoute.fromLat,
        secondRoute.fromLng,
      )

      if (transferGapKm > transferRadiusKm) continue

      pairs.push({ firstRoute, secondRoute, transferLat: firstRoute.toLat, transferLng: firstRoute.toLng })
    }
  }

  return pairs
}
