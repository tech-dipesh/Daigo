import { z } from "zod"

export const rideRequestSchema = z.object({
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
  groupSize: z.number().int().min(1).max(5).default(1),
  hasLuggage: z.boolean().default(false),
  notes: z.string().max(300).optional(),
  isVulnerable: z.boolean().default(false),
  womenOnly: z.boolean().default(false),
  acOnly: z.boolean().default(false),
  allowShared: z.boolean().default(false),
  forEmail: z.email().optional(),
  passenger: z.object({ name: z.string().min(3).max(15), age: z.number().int().min(1).max(13) }).optional(),
  vehiclePreference: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]).optional(),
})

export const priceEstimateQuerySchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
  groupSize: z.coerce.number().int().min(1).max(5).default(1),
  when: z.coerce.date().optional(),
  minor: z.enum(["true", "false"]).default("false"),
})

export type RideRequestInput = z.infer<typeof rideRequestSchema>
export type PriceEstimateQueryInput = z.infer<typeof priceEstimateQuerySchema>
