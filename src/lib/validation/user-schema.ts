import { z } from "zod"

export const mePatchSchema = z
  .object({
    role: z.enum(["RIDER", "DRIVER"]).optional(),
    name: z.string().min(3).max(15).optional(),
    email: z.email().optional(),
    language: z.enum(["EN", "NE", "HI"]).optional(),
    currentPassword: z.string().optional(),
  })
  .refine((b) => b.role || b.name || b.email || b.language, { message: "Send at least one field to update" })

export const notificationQuerySchema = z.object({
  unread: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.uuid().optional(),
})

export const warningQuerySchema = z.object({ scope: z.enum(["current", "all"]).default("current") })

export type MePatchInput = z.infer<typeof mePatchSchema>
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>
export type WarningQueryInput = z.infer<typeof warningQuerySchema>
