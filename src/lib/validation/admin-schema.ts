import { z } from "zod"

const dayMs = 24 * 60 * 60 * 1000

export const analyticsQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) })

export const appealDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(300).optional(),
})

export const appealListQuerySchema = z.object({ status: z.enum(["OPEN", "APPROVED", "REJECTED"]).default("OPEN") })

export const complaintDecisionSchema = z.object({
  status: z.enum(["IN_REVIEW", "RESOLVED", "REJECTED"]),
  note: z.string().max(300).optional(),
})

export const complaintListQuerySchema = z.object({ status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]).default("OPEN") })

export const documentReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(300).optional(),
})

export const exportSchema = z
  .object({
    type: z.enum(["trips", "users", "complaints"]),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((b) => !b.from || !b.to || (b.to > b.from && b.to.getTime() - b.from.getTime() <= 365 * dayMs), { message: "Pick a range of up to 365 days" })

export const fareRatePatchSchema = z.object({ perKm: z.number().min(1).max(40) })

export const fareRateTypeSchema = z.object({ type: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]) })

export const adminJobSchema = z.object({ action: z.enum(["schedule-autopost", "run-autopost"]) })

export const staffRoleSchema = z.object({
  staffRole: z.enum(["MODERATOR", "SUPER_ADMIN"]).nullable(),
})

export const vehicleReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(300).optional(),
})

export const verificationQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
})

export const zonePatchSchema = z
  .object({
    name: z.string().min(3).max(40).optional(),
    multiplier: z.number().min(0.5).max(3).optional(),
  })
  .refine((b) => b.name || b.multiplier, { message: "Send a name or multiplier to update" })
