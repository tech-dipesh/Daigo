import { z } from "zod"

export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ping") }),
  z.object({ type: z.literal("online") }),
  z.object({ type: z.literal("offline") }),
])

export const presenceSchema = z.object({ online: z.boolean("Please enter if you are online") })

export type WsMessageInput = z.infer<typeof wsMessageSchema>
export type PresenceInput = z.infer<typeof presenceSchema>
