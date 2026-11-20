import { z } from "zod"

export const contactUpdateSchema = z
  .object({
    name: z.string().min(3).max(15).optional(),
    phone: z.string().regex(/^\d{10}$/).optional(),
    email: z.email().nullable().optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: "Send at least one field to update" })

export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>
