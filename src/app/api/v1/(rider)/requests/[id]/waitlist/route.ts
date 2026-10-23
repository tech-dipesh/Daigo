import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { isExpired } from "@/lib/infra/matching/expiry"
import { waitlistHours } from "@/lib/infra/matching/waitlist"
import type { RouteParams } from "@/types/api"

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  await requireMember(riderId)
  const id = await idFrom(params)
  const target = await db.rideRequest.findFirst({ where: { id, riderId } })
  if (!target) throw new AppError("Ride request not found", 404)
  const lapsed = target.status === "EXPIRED" || (target.status === "PENDING" && isExpired(target.expiresAt))
  if (!lapsed) throw new AppError("Only an expired request can join the waitlist", 409)
  const current = await db.waitlist.findUnique({ where: { requestId: id } })
  if (current?.status === "WAITING" && current.expiresAt > new Date()) throw new AppError("This request is already on the waitlist", 409)
  const expiresAt = new Date(Date.now() + waitlistHours * 60 * 60 * 1000)
  const entry = await db.waitlist.upsert({
    where: { requestId: id },
    create: { requestId: id, riderId, expiresAt },
    update: { status: "WAITING", expiresAt, notifiedAt: null },
  })
  return successResponse(entry, 201)
})

export const DELETE = withErrorHandling<RouteParams>(async (request, { params }) => {
  const riderId = getUserId(request)
  const id = await idFrom(params)
  const { count } = await db.waitlist.updateMany({ where: { requestId: id, riderId, status: "WAITING" }, data: { status: "CANCELLED" } })
  if (!count) throw new AppError("This request is not on the waitlist", 404)
  return successResponse({ cancelled: true })
})
