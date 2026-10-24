import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"
import { appealDecisionSchema } from "@/lib/validation/admin-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const staff = await requireStaff(request)
  const id = await idFrom(params)
  const { status, note } = appealDecisionSchema.parse(await parseJsonBody(request))
  const appeal = await db.appeal.findUnique({ where: { id } })
  if (!appeal) throw new AppError("Appeal not found", 404)
  if (appeal.status !== "OPEN") throw new AppError("This appeal was already decided", 409)
  if (appeal.kind === "ACCOUNT" && staff.staffRole !== "SUPER_ADMIN") throw new AppError("Only a super admin decides account appeals", 403)
  const decided = await db.$transaction(async (tx) => {
    if (status === "APPROVED" && appeal.kind === "WARNING" && appeal.warningId) {
      await tx.warning.update({ where: { id: appeal.warningId }, data: { revokedAt: new Date() } })
    }
    if (status === "APPROVED" && appeal.kind === "ACCOUNT") {
      await tx.user.update({ where: { id: appeal.userId }, data: { isBanned: false, warningCycleStart: new Date() } })
    }
    return tx.appeal.update({ where: { id }, data: { status, decisionNote: note, decidedById: staff.id, decidedAt: new Date() } })
  })
  await notify(appeal.userId, "APPEAL", status === "APPROVED" ? "Appeal approved" : "Appeal rejected", note ?? `Your appeal was ${status.toLowerCase()}`, { appealId: id })
  return successResponse(decided)
})
