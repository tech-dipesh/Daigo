import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

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
  const ownerId = await requireUserId(request)
  const body = await request.json()
  const data = vehicleSchema.parse(body)

  const vehicle = await db.vehicle.create({ data: { ...data, ownerId } })

  return successResponse(vehicle, 201)
})

export const GET = withErrorHandling(async (request) => {
  const ownerId = await requireUserId(request)
  const vehicles = await db.vehicle.findMany({ where: { ownerId } })

  return successResponse(vehicles)
})
