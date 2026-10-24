import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { notifyWaitlist } from "@/lib/infra/matching/waitlist"
import { routeSchema } from "@/lib/validation/driver-schema"
import * as userRepo from "@/lib/repository/user-repo"

export const POST = withErrorHandling(async (request) => {
  const driverId = getUserId(request)
  await requireMember(driverId)
  const user = await userRepo.findById(driverId)
  if (user?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to create a route", 403)
  }
  const body = await parseJsonBody(request)
  const data = routeSchema.parse(body)
  const vehicle = await db.vehicle.findFirst({
    where: { id: data.vehicleId, ownerId: driverId },
  })
  if (!vehicle) {
    throw new AppError("Vehicle not found", 404)
  }
  if (vehicle.verificationStatus !== "APPROVED") {
    throw new AppError("This vehicle hasn't been approved yet", 403)
  }
  const licence = await db.driverDocument.findFirst({
    where: { userId: driverId, verificationStatus: "APPROVED" },
  })
  if (!licence) {
    throw new AppError("Your licence hasn't been approved yet", 403)
  }
  const route = await db.route.create({
    data: {
      ...data,
      departureTime: new Date(`1970-01-01T${data.departureTime}:00Z`),
      driverId,
    },
  })
  await notifyWaitlist(route)
  return successResponse(route, 201)
})

export const GET = withErrorHandling(async (request) => {
  const driverId = getUserId(request)
  const routes = await db.route.findMany({ where: { driverId } })
  return successResponse(routes)
})
