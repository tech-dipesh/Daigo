import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
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
