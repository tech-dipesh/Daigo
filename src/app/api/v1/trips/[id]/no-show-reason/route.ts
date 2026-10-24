import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import * as userRepo from "@/lib/repository/user-repo"
import { noShowReasonBonus, noShowReasonHours } from "@/lib/infra/economy/trip-rules"
import type { RouteParams } from "@/types/api"
import { noShowReasonSchema } from "@/lib/validation/trip-schema"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, riderId)
  if (trip.riderId !== riderId) throw new AppError("Only the rider can explain a no-show", 403)
  if (trip.status !== "NO_SHOW" || trip.noShowReason) throw new AppError("There is nothing to explain on this trip", 409)
  if (Date.now() - trip.updatedAt.getTime() > noShowReasonHours * 60 * 60 * 1000) throw new AppError("The time to explain this no-show is over", 409)
  const { reason } = noShowReasonSchema.parse(await parseJsonBody(request))
  const updated = await db.$transaction(async (tx) => {
    await userRepo.adjustTrust(tx, riderId, noShowReasonBonus)
    return tx.trip.update({ where: { id }, data: { noShowReason: reason } })
  })
  return successResponse(updated)
})
