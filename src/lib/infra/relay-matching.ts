import { db } from "@/lib/infra/db"


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
  // relay must have the car no bike
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

   return activeRoutes
}
