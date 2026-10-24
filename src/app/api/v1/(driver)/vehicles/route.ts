import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { assertOwnUpload } from "@/lib/infra/storage/uploads"
import { vehicleSchema } from "@/lib/validation/driver-schema"
import * as userRepo from "@/lib/repository/user-repo"

export const POST = withErrorHandling(async (request) => {
  const ownerId = getUserId(request)
  await requireMember(ownerId)
  const owner = await userRepo.findById(ownerId)
  if (owner?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to add a vehicle", 403)
  }
  const body = await parseJsonBody(request)
  const data = vehicleSchema.parse(body)
  await assertOwnUpload(data.rcUploadId, ownerId, "RC")
  const vehicle = await db.vehicle.create({ data: { ...data, ownerId } })
  return successResponse(vehicle, 201)
})

export const GET = withErrorHandling(async (request) => {
  const ownerId = getUserId(request)
  const vehicles = await db.vehicle.findMany({ where: { ownerId } })
  return successResponse(vehicles)
})
