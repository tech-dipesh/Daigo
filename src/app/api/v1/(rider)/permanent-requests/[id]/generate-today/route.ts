import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { generatePermanentRequest } from "@/lib/infra/matching/permanent"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const template = await db.permanentRideRequest.findFirst({ where: { id, riderId, isActive: true } })
  if (!template) throw new AppError("Permanent request not found or cancelled", 404)
  if (!template.daysOfWeek.includes(new Date().getUTCDay())) throw new AppError("This permanent request doesn't run today", 400)
  const rideRequest = await generatePermanentRequest(template)
  return successResponse(rideRequest)
})

/*
  the first preference will always be the prefer driver it even open to public
  fix window time to give 75 second reject/accept
  with a prefrerence routes for the route
*/
