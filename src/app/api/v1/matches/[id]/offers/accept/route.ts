import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { acceptMatch } from "@/lib/infra/matching/accept-match"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  await requireMember(userId)
  const id = await idFrom(params)
  const match = await db.match.findUnique({ where: { id }, include: { rideRequest: true, route: true, offers: { orderBy: { round: "desc" }, take: 1 } } })
  const party = match?.route.driverId === userId ? "DRIVER" : match?.rideRequest.riderId === userId ? "RIDER" : null
  if (!match || !party) throw new AppError("Match not found", 404)
  const last = match.offers[0]
  if (!last || last.by === party) throw new AppError("There is no offer waiting for your answer", 409)
  if (last.expiresAt < new Date()) throw new AppError("This offer expired", 410)
  const { trip } = await acceptMatch(id, last.price)
  return successResponse({ tripId: trip.id, price: last.price })
})
