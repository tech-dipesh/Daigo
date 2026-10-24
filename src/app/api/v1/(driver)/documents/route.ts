import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { assertOwnUpload } from "@/lib/infra/storage/uploads"
import { driverDocumentSchema } from "@/lib/validation/driver-schema"
import * as userRepo from "@/lib/repository/user-repo"

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  await requireMember(userId)
  const user = await userRepo.findById(userId)
  if (user?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to submit a licence", 403)
  }
  const body = await parseJsonBody(request)
  const data = driverDocumentSchema.parse(body)
  await assertOwnUpload(data.licenseUploadId, userId, "LICENCE")
  const document = await db.driverDocument.create({ data: { ...data, userId } })
  return successResponse(document, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const documents = await db.driverDocument.findMany({ where: { userId } })
  return successResponse(documents)
})
