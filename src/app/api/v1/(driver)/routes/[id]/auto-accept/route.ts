import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"

const autoSchema = z.object({
  enabled: z.boolean(),
  minPrice: z.number().int().min(0).max(2000).optional(),
  minPerKm: z.number().min(0).max(40).optional(),
  minTrust: z.number().int().min(0).max(100).optional(),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const { enabled, minPrice, minPerKm, minTrust } = autoSchema.parse(await parseJsonBody(request))
  const route = await db.route.findFirst({ where: { id, driverId } })
  if (!route) throw new AppError("Route not found", 404)
  const updated = await db.route.update({ where: { id }, data: { autoAccept: enabled, autoMinPrice: minPrice, autoMinPerKm: minPerKm, autoMinTrust: minTrust } })
  return successResponse(updated)
})
