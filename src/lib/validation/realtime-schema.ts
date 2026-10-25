import { z } from "zod"

export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ping") }),
  z.object({ type: z.literal("online") }),
  z.object({ type: z.literal("offline") }),
])

export type WsMessageInput = z.infer<typeof wsMessageSchema>
