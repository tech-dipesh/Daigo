import { z } from "zod"

export const cancelSchema = z.object({
  reason: z.string().max(300).optional(),
})

export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export const tripMessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
})

export const noShowReasonSchema = z.object({ reason: z.string().trim().min(10).max(200) })

export const paymentConfirmSchema = z.object({
  proofPhotoUrl: z.url(),
})

export const paymentSchema = z.object({
  method: z.enum(["ONLINE", "CASH"]),
  redeemCoins: z.boolean().default(false),
})

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  review: z.string().max(300).optional(),
  recommendTag: z.enum(["GOOD_CONVERSATION", "DRIVING_SKILL", "PUNCTUAL", "CLEAN_VEHICLE"]).optional(),
})

export const verifyPickupSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
})

export type CancelInput = z.infer<typeof cancelSchema>
export type LocationInput = z.infer<typeof locationSchema>
export type TripMessageInput = z.infer<typeof tripMessageSchema>
export type NoShowReasonInput = z.infer<typeof noShowReasonSchema>
export type PaymentConfirmInput = z.infer<typeof paymentConfirmSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type VerifyPickupInput = z.infer<typeof verifyPickupSchema>
