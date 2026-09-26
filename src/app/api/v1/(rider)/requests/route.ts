import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const rideRequestSchema = z.object({
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
  groupSize: z.number().int().min(1).max(5).default(1),
  hasLuggage: z.boolean().default(false),
  notes: z.string().max(300).optional(),
  isVulnerable: z.boolean().default(false),
  womenOnly: z.boolean().default(false),
  acOnly: z.boolean().default(false),
  vehiclePreference: z.enum(["BIKE", "SCOOTER", "CAR", "AUTO", "CAB"]).optional(),
})

export const POST = withErrorHandling(async (request) => {
  const riderId = await requireUserId(request)
  const user = await db.user.findUnique({ where: { id: riderId } })

  if (user?.activeRole !== "RIDER") {
    throw new AppError("Switch to rider mode to post a request", 403)
  }

  const body = await request.json()
  const data = rideRequestSchema.parse(body)

  if (data.windowEnd <= data.windowStart) {
    throw new AppError("The time window end must be after the start", 400)
  }

  const rideRequest = await db.rideRequest.create({ data: { ...data, riderId } })

  return successResponse(rideRequest, 201)
})

export const GET = withErrorHandling(async (request) => {
  const riderId = await requireUserId(request)
  const requests = await db.rideRequest.findMany({ where: { riderId } })

  return successResponse(requests)
})
