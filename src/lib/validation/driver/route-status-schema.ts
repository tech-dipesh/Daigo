import { z } from "zod"

export const routeStatusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED"]) })

export type RouteStatusInput = z.infer<typeof routeStatusSchema>
