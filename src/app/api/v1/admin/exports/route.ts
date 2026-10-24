import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { enqueue } from "@/lib/infra/queue/queue"
import { exportSchema } from "@/lib/validation/admin-schema"

const dayMs = 24 * 60 * 60 * 1000

export const POST = withErrorHandling(async (request) => {
  const staff = await requireStaff(request, "SUPER_ADMIN")
  const { type, from, to } = exportSchema.parse(await parseJsonBody(request))
  const end = to ?? new Date()
  const start = from ?? new Date(end.getTime() - 30 * dayMs)
  await enqueue({ name: "export.csv", payload: { type, from: start.toISOString(), to: end.toISOString(), requestedById: staff.id } })
  return successResponse({ queued: true, from: start, to: end }, 202)
})
