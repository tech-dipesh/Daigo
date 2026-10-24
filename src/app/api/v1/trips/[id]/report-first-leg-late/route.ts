import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { relayLatePenalty } from "@/lib/infra/economy/trust"
import * as tripRepo from "@/lib/repository/trip-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can report this", 403)
  if (trip.relayLeg !== "SECOND") throw new AppError("Only the second leg can report the first as late", 400)
  const firstLegTrip = await tripRepo.findRelayLeg(trip.relayMatchId, "FIRST")
  if (!firstLegTrip) throw new AppError("First leg trip not found", 404)
  if (firstLegTrip.status !== "PENDING_PICKUP") {
    throw new AppError("The first leg has already moved past pickup", 409)
  }
  await userRepo.adjustTrust(db, firstLegTrip.driverId, -relayLatePenalty)
  // second river can cancel if he want
  return successResponse({ firstLegTripId: firstLegTrip.id, penaltyApplied: relayLatePenalty })
})
