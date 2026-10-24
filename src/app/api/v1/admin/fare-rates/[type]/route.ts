import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import type { RouteParams } from "@/types/api"
import { fareRatePatchSchema } from "@/lib/validation/admin-schema"
import { fareRateTypeSchema } from "@/lib/validation/admin-schema"

export const PATCH = withErrorHandling<RouteParams<{ type: string }>>(async (request, { params }) => {
  await requireStaff(request)
  const { type } = fareRateTypeSchema.parse(await params)
  const { perKm } = fareRatePatchSchema.parse(await parseJsonBody(request))
  const rate = await db.fareRate.upsert({ where: { vehicleType: type }, create: { vehicleType: type, perKm }, update: { perKm } })
  return successResponse(rate)
})
