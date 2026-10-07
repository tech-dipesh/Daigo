import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { idFrom } from "@/lib/infra/route-params"
import { parseJsonBody } from "@/lib/infra/request"
import { getTripForUser } from "@/lib/infra/trip-access"
import { clampTrust, ratingDelta } from "@/lib/infra/trust"
import { RouteParams } from "@/types/api"


const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  review: z.string().max(300).optional(),
  recommendTag: z.enum(["GOOD_CONVERSATION", "DRIVING_SKILL", "PUNCTUAL", "CLEAN_VEHICLE"]).optional(),
})

export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const raterId = getUserId(request)
  const id = await idFrom(params)

  const trip = await getTripForUser(id, raterId)

  if (trip.status !== "COMPLETED") {
    throw new AppError("You can only rate a completed trip", 409)
  }

  const alreadyRated = await db.rating.findUnique({
    where: { tripId_raterId: { tripId: trip.id, raterId } },
  })

  if (alreadyRated) {
    throw new AppError("You have already rated The trip", 409)
  }

  const body = await parseJsonBody(request)
  const data = ratingSchema.parse(body)

  const ratedUserId = trip.riderId === raterId ? trip.driverId : trip.riderId

  const rating = await db.$transaction(async (tx) => {
    const created = await tx.rating.create({
      data: { ...data, tripId: trip.id, raterId, ratedUserId },
    })

    const { trustScore } = await tx.user.findUniqueOrThrow({
      where: { id: ratedUserId },
      select: { trustScore: true },
    })

    await tx.user.update({
      where: { id: ratedUserId },
      data: { trustScore: clampTrust(trustScore + ratingDelta(data.score)) },
    })

    return created
  })

  return successResponse(rating, 201)
})
