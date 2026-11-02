import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { pushMessage, readMessages } from "@/lib/infra/realtime/chat"
import { publishEvent } from "@/lib/infra/realtime/publish"
import type { TripMessageInput } from "@/lib/validation/trip/trip-schema"

export async function listMessages(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  return readMessages(trip.id)
}

export async function sendMessage(userId: string, id: string, { text }: TripMessageInput) {
  const trip = await getTripForUser(id, userId)
  if (trip.status !== "PENDING_PICKUP" && trip.status !== "IN_PROGRESS") throw new AppError("Chat is closed for this trip", 409)
  const message = await pushMessage(trip.id, userId, text)
  const other = trip.riderId === userId ? trip.driverId : trip.riderId
  await publishEvent(other, "chat.message", { tripId: trip.id, message })
  return message
}
