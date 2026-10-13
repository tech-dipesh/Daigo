import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const events = await db.emergencyEvent.findMany({
    where: { status: "OPEN" },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return successResponse(events)
})
