import { db } from "@/lib/infra/clients/db"

export const placesOf = (rideRequestId: string) =>
  db.rideRequest.findUniqueOrThrow({ where: { id: rideRequestId }, select: { fromLabel: true, fromLat: true, fromLng: true, toLabel: true, toLat: true, toLng: true } })
