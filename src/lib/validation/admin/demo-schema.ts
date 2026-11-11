import { z } from "zod"

export const demoSeedSchema = z.object({ size: z.enum(["full", "quick"]).default("full") })
export const scenarioNames = ["normal-match", "no-driver", "double-accept", "emergency", "cancel-after-accept", "payment-mismatch", "vulnerable-request"] as const
export const scenarioSchema = z.object({ name: z.enum([...scenarioNames, "all"]).default("all") })
export const benchmarkSchema = z.object({ routes: z.number().int().min(1000).max(50000).default(20000), runs: z.number().int().min(5).max(100).default(30) })
export const forceAssignSchema = z.object({ requestId: z.uuid(), routeId: z.uuid() })
export const forceExpireSchema = z.object({ requestId: z.uuid() })
export const forceArrivalSchema = z.object({ tripId: z.uuid(), minutesAgo: z.number().int().min(0).max(120).default(6) })

export type DemoSeedInput = z.infer<typeof demoSeedSchema>
export type ScenarioInput = z.infer<typeof scenarioSchema>
export type BenchmarkInput = z.infer<typeof benchmarkSchema>
export type ForceAssignInput = z.infer<typeof forceAssignSchema>
export type ForceExpireInput = z.infer<typeof forceExpireSchema>
export type ForceArrivalInput = z.infer<typeof forceArrivalSchema>
