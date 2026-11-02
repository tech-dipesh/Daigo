import { z } from "zod"

export const appealSchema = z.object({
  kind: z.enum(["WARNING", "ACCOUNT"]),
  warningId: z.uuid().optional(),
  text: z.string().trim().min(20).max(500),
})

export const complaintSchema = z.object({
  tripId: z.uuid(),
  type: z.enum(["PAYMENT", "ROUTE", "RATING", "CONDUCT", "OTHER"]),
  text: z.string().trim().min(10).max(500),
})

export type AppealInput = z.infer<typeof appealSchema>
export type ComplaintInput = z.infer<typeof complaintSchema>
