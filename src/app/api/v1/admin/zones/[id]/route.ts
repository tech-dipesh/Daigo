import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { idFrom } from "@/lib/infra/http/route-params"
import type { RouteParams } from "@/types/api"

const patchSchema = z
  .object({
    name: z.string().min(3).max(40).optional(),
    multiplier: z.number().min(0.5).max(3).optional(),
  })
  .refine((b) => b.name || b.multiplier, { message: "Send a name or multiplier to update" })

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const data = patchSchema.parse(await parseJsonBody(request))
  const zone = await db.zone.update({ where: { id }, data })
  return successResponse(zone)
})
