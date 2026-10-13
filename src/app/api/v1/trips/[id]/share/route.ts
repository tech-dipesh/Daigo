import { randomBytes } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, userId)
  if (trip.shareToken) {
    return successResponse({ shareToken: trip.shareToken })
  }
  const shareToken = randomBytes(16).toString("hex")
  await db.trip.update({ where: { id: trip.id }, data: { shareToken } })
  return successResponse({ shareToken })
})
