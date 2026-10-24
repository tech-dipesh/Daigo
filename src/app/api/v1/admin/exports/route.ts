import { z } from "zod"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { enqueue } from "@/lib/infra/queue/queue"

const dayMs = 24 * 60 * 60 * 1000
const exportSchema = z
  .object({
    type: z.enum(["trips", "users", "complaints"]),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((b) => !b.from || !b.to || (b.to > b.from && b.to.getTime() - b.from.getTime() <= 365 * dayMs), { message: "Pick a range of up to 365 days" })

export const POST = withErrorHandling(async (request) => {
  const staff = await requireStaff(request, "SUPER_ADMIN")
  const { type, from, to } = exportSchema.parse(await parseJsonBody(request))
  const end = to ?? new Date()
  const start = from ?? new Date(end.getTime() - 30 * dayMs)
  await enqueue({ name: "export.csv", payload: { type, from: start.toISOString(), to: end.toISOString(), requestedById: staff.id } })
  return successResponse({ queued: true, from: start, to: end }, 202)
})
