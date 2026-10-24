import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { expiryFromNow } from "@/lib/infra/matching/expiry"
import { rideRequestSchema } from "@/lib/validation/request-schema"
import * as userRepo from "@/lib/repository/user-repo"

export const POST = withErrorHandling(async (request) => {
  const riderId = getUserId(request)
  await requireMember(riderId)
  const user = await userRepo.findById(riderId)

  if (user?.activeRole !== "RIDER") {
    throw new AppError("Switch to rider mode to post a request", 403)
  }

  const body = await parseJsonBody(request)
  const { passenger, ...data } = rideRequestSchema.parse(body)

  if (data.windowEnd <= data.windowStart) {
    throw new AppError("The time window end must be after the start", 400)
  }

  const duplicateRequest = await db.rideRequest.findFirst({
    where: {
      riderId,
      status: "PENDING",
      fromLat: data.fromLat,
      fromLng: data.fromLng,
      toLat: data.toLat,
      toLng: data.toLng,
      windowStart: { lt: data.windowEnd },
      windowEnd: { gt: data.windowStart },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  if (duplicateRequest) {
    throw new AppError("You already have an active request for this trip", 409)
  }

  const minor = passenger ? { minorName: passenger.name, minorAge: passenger.age, isVulnerable: true } : {}
  const rideRequest = await db.rideRequest.create({ data: { ...data, ...minor, riderId, expiresAt: expiryFromNow() } })

  return successResponse(rideRequest, 201)
})

export const GET = withErrorHandling(async (request) => {
  const riderId = getUserId(request)
  const requests = await db.rideRequest.findMany({ where: { riderId } })

  return successResponse(requests)
})
