import { randomBytes, randomInt } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { parseJsonBody } from "@/lib/infra/http/request"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { isExpired } from "@/lib/infra/matching/expiry"
import { assertCanAccept } from "@/lib/infra/matching/booking-guard"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import type { RouteParams } from "@/types/api"

const matchDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  await requireMember(driverId)
  const id = await idFrom(params)
  const match = await db.match.findFirst({
    where: { id, route: { driverId } },
    include: { rideRequest: { include: { rider: true } } },
  })
  if (!match) throw new AppError("Match not found", 404)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)
  const body = await parseJsonBody(request)
  const { status } = matchDecisionSchema.parse(body)
  if (status === "ACCEPTED" && isExpired(match.rideRequest.expiresAt)) throw new AppError("This request has expired", 410)
  const { riderId, groupSize, rider } = match.rideRequest
  const result = await db.$transaction(async (tx) => {
    if (status === "ACCEPTED") {
      await assertCanAccept(tx, driverId, match.routeId, match.rideRequest)
      // for atomic request can't win same request.
      const claimed = await tx.rideRequest.updateMany({
        where: { id: match.rideRequestId, status: "PENDING" },
        data: { status: "MATCHED" },
      })
      if (!claimed.count) throw new AppError("This request is already matched", 409)
      const seated = await tx.route.updateMany({
        where: { id: match.routeId, status: "ACTIVE", seatsAvailable: { gte: groupSize } },
        data: { seatsAvailable: { decrement: groupSize } },
      })
      if (!seated.count) throw new AppError("This route is full or no longer active", 409)
      const trip = await tx.trip.create({
        data: {
          matchId: match.id,
          rideRequestId: match.rideRequestId,
          routeId: match.routeId,
          riderId,
          driverId,
          priceEstimate: match.priceEstimate,
          pickupOtp: randomInt(100000, 999999).toString(),
          shareToken: match.rideRequest.minorAge === null ? undefined : randomBytes(16).toString("hex"),
        },
      })
      const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status } })
      return { updatedMatch, trip }
    }
    const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status } })
    return { updatedMatch, trip: null }
  })
  if (result.trip) {
    await publishEvent(riderId, "match.accepted", { tripId: result.trip.id, matchId: match.id })
    await notify(riderId, "MATCH_ACCEPTED", "Driver accepted", "A driver accepted your ride request", { tripId: result.trip.id })
    const shareNote = result.trip.shareToken ? `\n\nFollow the trip live: ${env.APP_URL}/api/v1/trips/shared/${result.trip.shareToken}` : ""
    await sendEmailBestEffort({
      to: rider.email,
      subject: "Your DaiGo pickup code",
      text: `Your driver has accepted your request. Share this code at pickup: ${result.trip.pickupOtp}${shareNote}`,
    })
  }
  return successResponse(result.updatedMatch)
})
