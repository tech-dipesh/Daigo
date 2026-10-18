import { redis } from "@/lib/infra/clients/redis"

export type ChatMessage = { id: string; senderId: string; text: string; at: string }

const maxMessages = 200
const ttlSeconds = 60 * 60 * 24 * 7
const chatKey = (tripId: string) => `chat:${tripId}`

export async function pushMessage(tripId: string, senderId: string, text: string) {
  const message: ChatMessage = { id: crypto.randomUUID(), senderId, text, at: new Date().toISOString() }
  const pipe = redis.pipeline()
  pipe.rpush(chatKey(tripId), message)
  pipe.ltrim(chatKey(tripId), -maxMessages, -1)
  pipe.expire(chatKey(tripId), ttlSeconds)
  await pipe.exec()
  return message
}

export const readMessages = (tripId: string) => redis.lrange<ChatMessage>(chatKey(tripId), 0, -1)

/*
  ttl cleans it anyway if this fails
  not worth failing a rating for
*/
export async function clearChat(tripId: string) {
  try { await redis.del(chatKey(tripId)) } catch (error) { console.error("clear chat failed", error) }
}
