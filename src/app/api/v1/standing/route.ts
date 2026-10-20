import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { activeWarningCount, banAtSuspension, isSuspended, warningLimit } from "@/lib/infra/economy/warnings"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const [user, active, items] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { isBanned: true, suspendedFrom: true, suspendedUntil: true, suspensionCount: true } }),
    activeWarningCount(userId),
    db.warning.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ])
  const suspension = { suspended: isSuspended(user), banned: user.isBanned, from: user.suspendedFrom, until: user.suspendedUntil, count: user.suspensionCount, banAt: banAtSuspension }
  return successResponse({ warnings: { active, limit: warningLimit, items }, suspension })
})
