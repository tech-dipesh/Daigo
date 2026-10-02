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
  
  return successResponse(`The Leg is: ${leg} with active Status`)
})
