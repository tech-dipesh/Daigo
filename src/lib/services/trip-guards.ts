import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"

export async function asDriver(id: string, userId: string, message: string) {
  const trip = await getTripForUser(id, userId)
  if (trip.driverId !== userId) throw new AppError(message, 403)
  return trip
}
