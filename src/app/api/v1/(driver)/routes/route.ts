import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const routeSchema = z.object({
  vehicleId: z.string(),
  routeType: z.enum(["REGULAR", "ADVANCE"]),
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  departureDate: z.coerce.date().optional(),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  detourLimitKm: z.number().min(0).max(20),
  seatsAvailable: z.number().int().min(1).max(5),
})

export const POST = withErrorHandling(async (request) => {
  const driverId = await requireUserId(request)
  const user = await db.user.findUnique({ where: { id: driverId } })

  if (user?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to create a route", 403)
  }

  const body = await request.json()
  const data = routeSchema.parse(body)

  const vehicle = await db.vehicle.findFirst({
    where: { id: data.vehicleId, ownerId: driverId },
  })

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404)
  }

  const route = await db.route.create({
    data: {
      ...data,
      departureTime: new Date(`1970-01-01T${data.departureTime}:00Z`),
      driverId,
    },
  })

  return successResponse(route, 201)
})

export const GET = withErrorHandling(async (request) => {
  const driverId = await requireUserId(request)
  const routes = await db.route.findMany({ where: { driverId } })

  return successResponse(routes)
})
