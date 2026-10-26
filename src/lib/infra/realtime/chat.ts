import { redis } from "@/lib/infra/clients/redis"

export type ChatMessage = { id: string; senderId: string; text: string; at: string }

const maxMessages = 200
const ttlSeconds = 60 * 60 * 24 * 7
const chatKey = (room: string) => `chat:${room}`

export async function pushMessage(room: string, senderId: string, text: string) {
  const message: ChatMessage = { id: crypto.randomUUID(), senderId, text, at: new Date().toISOString() }
  const pipe = redis.pipeline()
  pipe.rpush(chatKey(room), message)
  pipe.ltrim(chatKey(room), -maxMessages, -1)
  pipe.expire(chatKey(room), ttlSeconds)
  await pipe.exec()
  return message
}

export const readMessages = (room: string) => redis.lrange<ChatMessage>(chatKey(room), 0, -1)

/*
  ttl cleans it anyway if this fails
  not worth failing a rating for
*/
export async function clearChat(room: string) {
  try { await redis.del(chatKey(room)) } catch (error) { console.error("clear chat failed", error) }
}
