import { randomInt } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { parseJsonBody } from "@/lib/infra/request"
import { sendEmailBestEffort } from "@/lib/infra/email"
import { RouteParams } from "@/types/api"


const matchDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)

  const match = await db.match.findFirst({
    where: { id, route: { driverId } },
    include: { rideRequest: { include: { rider: true } } },
  })

  if (!match) throw new AppError("Match not found", 404)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)

  const body = await parseJsonBody(request)
  const { status } = matchDecisionSchema.parse(body)
  const { riderId, groupSize, rider } = match.rideRequest

  const result = await db.$transaction(async (tx) => {
    if (status === "ACCEPTED") {
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
        },
      })

      const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status } })
      return { updatedMatch, trip }
    }

    const updatedMatch = await tx.match.update({ where: { id: match.id }, data: { status } })
    return { updatedMatch, trip: null }
  })

  if (result.trip) {
    await sendEmailBestEffort({
      to: rider.email,
      subject: "Your DaiGo pickup code",
      text: `Your driver has accepted your request. Share this code at pickup: ${result.trip.pickupOtp}`,
    })
  }

  return successResponse(result.updatedMatch)
})
