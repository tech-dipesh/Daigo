import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import type { RouteParams } from "@/types/api"

const typeSchema = z.object({ type: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]) })
const patchSchema = z.object({ perKm: z.number().min(1).max(40) })

export const PATCH = withErrorHandling<RouteParams<{ type: string }>>(async (request, { params }) => {
  await requireStaff(request)
  const { type } = typeSchema.parse(await params)
  const { perKm } = patchSchema.parse(await parseJsonBody(request))
  const rate = await db.fareRate.upsert({ where: { vehicleType: type }, create: { vehicleType: type, perKm }, update: { perKm } })
  return successResponse(rate)
})
