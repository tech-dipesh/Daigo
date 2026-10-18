import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { expiryFromNow, isExpired } from "@/lib/infra/matching/expiry"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const old = await db.rideRequest.findFirst({ where: { id, riderId } })
  if (!old) throw new AppError("Ride request not found", 404)
  const lapsed = old.status === "EXPIRED" || (old.status === "PENDING" && isExpired(old.expiresAt))
  if (!lapsed) throw new AppError("Only an expired request can be retried", 409)
  const length = old.windowEnd.getTime() - old.windowStart.getTime()
  const windowStart = new Date(Math.max(old.windowStart.getTime(), Date.now()))
  const windowEnd = new Date(windowStart.getTime() + length)
  const fresh = await db.$transaction(async (tx) => {
    await tx.rideRequest.update({ where: { id: old.id }, data: { status: "EXPIRED" } })
    return tx.rideRequest.create({
      data: {
        riderId,
        fromLabel: old.fromLabel,
        fromLat: old.fromLat,
        fromLng: old.fromLng,
        toLabel: old.toLabel,
        toLat: old.toLat,
        toLng: old.toLng,
        windowStart,
        windowEnd,
        groupSize: old.groupSize,
        hasLuggage: old.hasLuggage,
        notes: old.notes,
        isVulnerable: old.isVulnerable,
        womenOnly: old.womenOnly,
        acOnly: old.acOnly,
        vehiclePreference: old.vehiclePreference,
        expiresAt: expiryFromNow(),
      },
    })
  })
  return successResponse(fresh, 201)
})
