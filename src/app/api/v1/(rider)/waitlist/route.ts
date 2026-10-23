import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

export const GET = withErrorHandling(async (request) => {
  const riderId = getUserId(request)
  const entries = await db.waitlist.findMany({ where: { riderId, status: "WAITING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } })
  return successResponse(entries)
})
