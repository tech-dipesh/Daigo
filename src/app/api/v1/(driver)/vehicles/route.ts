import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"

const vehicleSchema = z.object({
  type: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]),
  make: z.string().min(1),
  model: z.string().min(1),
  plateNumber: z.string().min(4).max(15),
  seatCapacity: z.number().int().min(1).max(5),
  rcNumber: z.string().min(6).max(20),
  rcPhotoUrl: z.url(),
})

export const POST = withErrorHandling(async (request) => {
  const ownerId = getUserId(request)
  const owner = await db.user.findUnique({ where: { id: ownerId } })

  if (owner?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to add a vehicle", 403)
  }

  const body = await parseJsonBody(request)
  const data = vehicleSchema.parse(body)

  const vehicle = await db.vehicle.create({ data: { ...data, ownerId } })

  return successResponse(vehicle, 201)
})

export const GET = withErrorHandling(async (request) => {
  const ownerId = getUserId(request)
  const vehicles = await db.vehicle.findMany({ where: { ownerId } })

  return successResponse(vehicles)
})
