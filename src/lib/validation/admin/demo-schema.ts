import { z } from "zod"

export const demoSeedSchema = z.object({ size: z.enum(["full", "quick"]).default("full") })
export const forceAssignSchema = z.object({ requestId: z.uuid(), routeId: z.uuid() })
export const forceExpireSchema = z.object({ requestId: z.uuid() })
export const forceArrivalSchema = z.object({ tripId: z.uuid(), minutesAgo: z.number().int().min(0).max(120).default(6) })

export type DemoSeedInput = z.infer<typeof demoSeedSchema>
export type ForceAssignInput = z.infer<typeof forceAssignSchema>
export type ForceExpireInput = z.infer<typeof forceExpireSchema>
export type ForceArrivalInput = z.infer<typeof forceArrivalSchema>
