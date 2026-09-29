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

  const match = await db.match.findFirst({
    where: { id, route: { driverId } },
    include: { rideRequest: true },
  })

  if (!match) throw new AppError("Match not found", 404)
  if (match.status !== "PENDING") throw new AppError("This match has already been decided", 409)

  const body = await parseJsonBody(request)
  const { status } = matchDecisionSchema.parse(body)
  const { riderId, groupSize } = match.rideRequest

  const updated = await db.$transaction(async (tx) => {
    if (status === "ACCEPTED") {
      // atomic operation no two driver won same request ad
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

      await tx.trip.create({
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
    }

    return tx.match.update({ where: { id: match.id }, data: { status } })
  })

  return successResponse(updated)
})
