import { z } from "zod"

const clock = z.string().regex(/^\d{2}:\d{2}$/)

export const permanentSchema = z.object({
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  windowStart: clock,
  windowEnd: clock,
  groupSize: z.number().int().min(1).max(5).default(1),
  vehiclePreference: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]).optional(),
  preferredDriverId: z.uuid("Please enter a valid preferred driver").optional(),
})

export type PermanentInput = z.infer<typeof permanentSchema>
