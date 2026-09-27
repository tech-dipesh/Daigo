import { db } from "@/lib/infra/db"
import { AppError } from "@/lib/infra/response"

export async function getTripForUser(tripId: string, userId: string) {
  const trip = await db.trip.findFirst({
    where: { id: tripId, OR: [{ riderId: userId }, { driverId: userId }] },
  })

  if (!trip) {
    throw new AppError("Trip not found", 404)
  }

  return trip
}
