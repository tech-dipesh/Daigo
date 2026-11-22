import { z } from "zod"

export const notificationTypes = ["MATCH_ACCEPTED", "TRIP_STATUS", "PAYMENT", "VERIFICATION", "WARNING", "BAN", "APPEAL", "COMPLAINT", "OFFER", "WAITLIST", "SAVINGS", "EXPORT"] as const
export type NotificationType = (typeof notificationTypes)[number]

const dataSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))

export const jobSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("email.send"), payload: z.object({ to: z.string(), subject: z.string(), text: z.string() }) }),
  z.object({ name: z.literal("notification.save"), payload: z.object({ id: z.uuid(), userId: z.uuid(), type: z.enum(notificationTypes), title: z.string(), body: z.string(), data: dataSchema }) }),
  z.object({ name: z.literal("permanent.autopost"), payload: z.object({}) }),
  z.object({ name: z.literal("export.csv"), payload: z.object({ exportId: z.uuid(), type: z.enum(["trips", "users", "complaints"]), from: z.string(), to: z.string(), requestedById: z.uuid() }) }),
])

export type Job = z.infer<typeof jobSchema>
