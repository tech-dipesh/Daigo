import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { getTripForUser } from "@/lib/infra/trip-access"
import { clampTrust, relayLatePenalty } from "@/lib/infra/trust"
import { RouteParams } from "@/types/api"


export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)

  const trip = await getTripForUser(id, driverId)

  if (trip.driverId !== driverId) throw new AppError("Only the driver can report for any rider", 403)
  if (trip.relayLeg !== "SECOND") throw new AppError("Only the second leg can report the first as late", 400)

  const firstLegTrip = await db.trip.findFirst({
    where: { relayMatchId: trip.relayMatchId, relayLeg: "FIRST" },
  })

  if (!firstLegTrip) throw new AppError("First leg trip not found", 404)
  if (firstLegTrip.status !== "PENDING_PICKUP") {
    throw new AppError("The first leg has already moved past pickup", 409)
  }

  await db.$transaction(async (tx) => {
    const { trustScore } = await tx.user.findUniqueOrThrow({
      where: { id: firstLegTrip.driverId },
      select: { trustScore: true },
    })

    await tx.user.update({
      where: { id: firstLegTrip.driverId },
      data: { trustScore: clampTrust(trustScore - relayLatePenalty) },
    })
  })
  // second river can cancel if he want
  return successResponse({ firstLegTripId: firstLegTrip.id, penaltyApplied: relayLatePenalty })
})
