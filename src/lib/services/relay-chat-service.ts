import { AppError } from "@/lib/infra/http/response"
import { pushMessage, readMessages } from "@/lib/infra/realtime/chat"
import { publishEvent } from "@/lib/infra/realtime/publish"
import * as relayRepo from "@/lib/repository/relay-repo"
import type { TripMessageInput } from "@/lib/validation/trip-schema"

async function asRelayDriver(id: string, driverId: string) {
  const relay = await relayRepo.findForDriver(id, driverId)
  if (!relay) throw new AppError("Relay match not found", 404)
  if (relay.status === "REJECTED") throw new AppError("Chat is closed for this relay", 409)
  return relay
}

export async function listRelayMessages(driverId: string, id: string) {
  await asRelayDriver(id, driverId)
  return readMessages(`relay:${id}`)
}

export async function sendRelayMessage(driverId: string, id: string, { text }: TripMessageInput) {
  const relay = await asRelayDriver(id, driverId)
  const message = await pushMessage(`relay:${id}`, driverId, text)
  const other = relay.firstRoute.driverId === driverId ? relay.secondRoute.driverId : relay.firstRoute.driverId
  await publishEvent(other, "chat.message", { relayMatchId: id, message })
  return message
}
