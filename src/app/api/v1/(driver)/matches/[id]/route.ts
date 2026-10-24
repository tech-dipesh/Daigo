import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { acceptMatch } from "@/lib/infra/matching/accept-match"
import type { RouteParams } from "@/types/api"
import { matchDecisionSchema } from "@/lib/validation/match-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const match = await db.match.findFirst({ where: { id, route: { driverId } }, include: { offers: { select: { id: true } } } })
  if (!match) throw new AppError("Match not found", 404)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)
  const { status } = matchDecisionSchema.parse(await parseJsonBody(request))
  if (status === "ACCEPTED") {
    if (match.offers.length) throw new AppError("This match has offers, answer them from the offers endpoints", 409)
    const { updatedMatch } = await acceptMatch(id)
    return successResponse(updatedMatch)
  }
  const rejected = await db.match.update({ where: { id }, data: { status } })
  return successResponse(rejected)
})
