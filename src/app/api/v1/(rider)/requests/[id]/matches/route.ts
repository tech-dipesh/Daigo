import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { distanceKm } from "@/lib/infra/geo"
import { estimatePrice } from "@/lib/infra/pricing"

type RouteParams = { params: Promise<{ id: string }> }

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const { id } = await params

  const rideRequest = await db.rideRequest.findFirst({ where: { id, riderId } })

  if (!rideRequest) {
    throw new AppError("Ride request not found", 404)
  }

   return successResponse("Successfully Create a Ride")
})
