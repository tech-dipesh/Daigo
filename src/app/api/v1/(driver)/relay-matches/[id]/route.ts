import { randomInt } from "node:crypto"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { idFrom } from "@/lib/infra/route-params"
type RouteParams = { params: Promise<{ id: string }> }
const decisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
})
export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const driverId = getUserId(request)
  const id = await idFrom(params)
  const relayMatch = await db.relayMatch.findFirst({
    where: { id, OR: [{ firstRoute: { driverId } }, { secondRoute: { driverId } }] },
    include: { firstRoute: true, secondRoute: true, rideRequest: true },
  })
  if (!relayMatch) throw new AppError("Relay match not found", 404)
  if (relayMatch.status !== "PENDING") throw new AppError("The relay has already been decided", 409)
  const { status } = decisionSchema.parse(await parseJsonBody(request))
  const leg = relayMatch.firstRoute.driverId === driverId ? "first" : "second"
  
  const updated = await db.$transaction(async (tx) => {
    const legField = leg === "first" ? "firstLegStatus" : "secondLegStatus"
    const relay = await tx.relayMatch.update({
      where: { id: relayMatch.id },
      data: { [legField]: status },
    })
    if (status === "REJECTED") {
      return tx.relayMatch.update({ where: { id: relay.id }, data: { status: "REJECTED" } })
    }
    const bothAccepted = relay.firstLegStatus === "ACCEPTED" && relay.secondLegStatus === "ACCEPTED"
    if (!bothAccepted) return relay
    const { groupSize, riderId } = relayMatch.rideRequest
    const claimed = await tx.rideRequest.updateMany({
      where: { id: relayMatch.rideRequestId, status: "PENDING" },
      data: { status: "MATCHED" },
    })
    if (!claimed.count) throw new AppError("The request is already matched", 409)
    for (const [routeId, routeDriverId] of [
      [relayMatch.firstRouteId, relayMatch.firstRoute.driverId],
      [relayMatch.secondRouteId, relayMatch.secondRoute.driverId],
    ] as const) {
      const seated = await tx.route.updateMany({
        where: { id: routeId, status: "ACTIVE", seatsAvailable: { gte: groupSize } },
        data: { seatsAvailable: { decrement: groupSize } },
      })
      if (!seated.count) throw new AppError("A leg of The relay is no longer available", 409)
      await tx.trip.create({
        data: {
          relayMatchId: relay.id,
          relayLeg: routeId === relayMatch.firstRouteId ? "FIRST" : "SECOND",
          rideRequestId: relayMatch.rideRequestId,
          routeId,
          riderId,
          driverId: routeDriverId,
          priceEstimate: relay.priceEstimate,
          pickupOtp: randomInt(100000, 999999).toString(),
        },
      })
    }
    return tx.relayMatch.update({ where: { id: relay.id }, data: { status: "CONFIRMED" } })
  })
  return successResponse(updated)
})
