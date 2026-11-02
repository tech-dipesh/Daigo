import { z } from "zod"

export const matchDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export const relayDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export const autoAcceptSchema = z.object({
  enabled: z.boolean(),
  minPrice: z.number().int().min(0).max(2000).optional(),
  minPerKm: z.number().min(0).max(40).optional(),
  minTrust: z.number().int().min(0).max(100).optional(),
})

export const offerSchema = z.object({ price: z.number().int().min(1) })

export type MatchDecisionInput = z.infer<typeof matchDecisionSchema>
export type RelayDecisionInput = z.infer<typeof relayDecisionSchema>
export type AutoAcceptInput = z.infer<typeof autoAcceptSchema>
export type OfferInput = z.infer<typeof offerSchema>
