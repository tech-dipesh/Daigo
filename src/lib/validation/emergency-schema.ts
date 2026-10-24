import { z } from "zod"

export const emergencyContactSchema = z.object({
  name: z.string().min(3).max(15),
  phone: z.string().regex(/^\d{10}$/),
  email: z.email().optional(),
  isPrimary: z.boolean().default(false),
  yourName: z.string().min(3).max(15).optional(),
})

export const emergencySchema = z.object({
  tripId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
})
