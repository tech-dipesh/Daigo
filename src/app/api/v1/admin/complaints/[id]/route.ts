import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"

const decisionSchema = z.object({
  status: z.enum(["IN_REVIEW", "RESOLVED", "REJECTED"]),
  note: z.string().max(300).optional(),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const staff = await requireStaff(request)
  const id = await idFrom(params)
  const { status, note } = decisionSchema.parse(await parseJsonBody(request))
  const current = await db.complaint.findUnique({ where: { id } })
  if (!current) throw new AppError("Complaint not found", 404)
  if (current.status === "RESOLVED" || current.status === "REJECTED") throw new AppError("This complaint is already closed", 409)
  const complaint = await db.complaint.update({ where: { id }, data: { status, adminNote: note, handledById: staff.id } })
  await notify(complaint.filedById, "COMPLAINT", "Complaint update", `Your complaint is now ${status.replace("_", " ").toLowerCase()}`, { complaintId: id })
  return successResponse(complaint)
})
