import { randomInt } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"

type RouteParams = { params: Promise<{ id: string }> }

const matchDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const { id } = await params

  const match = await db.match.findFirst({ where: { id, route: { driverId } } })

  if (!match) {
    throw new AppError("Match not found", 404)
  }

  const body = await parseJsonBody(request)
  const { status } = matchDecisionSchema.parse(body)

  const updated = await db.$transaction(async (tx) => {
    const updatedMatch = await tx.match.update({
      where: { id: match.id },
      data: { status },
    })

    if (status === "ACCEPTED") {
      const rideRequest = await tx.rideRequest.update({
        where: { id: match.rideRequestId },
        data: { status: "MATCHED" },
      })

      await tx.route.update({
        where: { id: match.routeId },
        data: { seatsAvailable: { decrement: 1 } }
      })

      const pickupOtp = randomInt(100000, 999999).toString()

      await tx.trip.create({
        data: {
          matchId: match.id,
          rideRequestId: match.rideRequestId,
          routeId: match.routeId,
          riderId: rideRequest.riderId,
          driverId,
          priceEstimate: match.priceEstimate,
          pickupOtp,
        },
      })
    }

    return updatedMatch
  })

  return successResponse(updated)
})
