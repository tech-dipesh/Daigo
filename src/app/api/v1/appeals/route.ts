import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { isSuspended } from "@/lib/infra/economy/warnings"

const appealSchema = z.object({
  kind: z.enum(["WARNING", "ACCOUNT"]),
  warningId: z.uuid().optional(),
  text: z.string().trim().min(10).max(500),
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const appeals = await db.appeal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
  return successResponse(appeals)
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const { kind, warningId, text } = appealSchema.parse(await parseJsonBody(request))
  if (kind === "WARNING") {
    if (!warningId) throw new AppError("Send the warningId you want to appeal", 400)
    const warning = await db.warning.findFirst({ where: { id: warningId, userId, revokedAt: null } })
    if (!warning) throw new AppError("Warning not found", 404)
  } else {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { isBanned: true, suspendedFrom: true, suspendedUntil: true } })
    if (!isSuspended(user)) throw new AppError("Your account is not suspended", 409)
  }
  const target = kind === "WARNING" ? warningId : null
  const open = await db.appeal.findFirst({ where: { userId, kind, status: "OPEN", warningId: target } })
  if (open) throw new AppError("You already have an open appeal for this", 409)
  const appeal = await db.appeal.create({ data: { userId, kind, warningId: target, text } })
  return successResponse(appeal, 201)
})
