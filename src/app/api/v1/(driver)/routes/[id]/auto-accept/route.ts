import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"
import { autoAcceptSchema } from "@/lib/validation/match-schema"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const { enabled, minPrice, minPerKm, minTrust } = autoAcceptSchema.parse(await parseJsonBody(request))
  const route = await db.route.findFirst({ where: { id, driverId } })
  if (!route) throw new AppError("Route not found", 404)
  const updated = await db.route.update({ where: { id }, data: { autoAccept: enabled, autoMinPrice: minPrice, autoMinPerKm: minPerKm, autoMinTrust: minTrust } })
  return successResponse(updated)
})
