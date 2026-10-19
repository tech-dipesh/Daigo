import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const rates = await db.fareRate.findMany({ orderBy: { perKm: "asc" } })
  return successResponse(rates)
})
