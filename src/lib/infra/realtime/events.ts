export type EventType = "request.new" | "match.accepted" | "trip.status" | "trip.location" | "emergency.new" | "notification" | "chat.message" | "offer.new"
export type RealtimeEvent = { id: string; type: EventType; data: unknown; at: string }
export const userChannel = (userId: string) => `user:${userId}`
export const inboxKey = (userId: string) => `inbox:${userId}`
export const adminChannel = "admin"
