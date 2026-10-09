import { db } from "@/lib/infra/db"
import { requireStaff } from "@/lib/infra/admin-access"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import type { RouteParams } from "@/types/api"

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const event = await db.emergencyEvent.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  })
  return successResponse(event)
})
