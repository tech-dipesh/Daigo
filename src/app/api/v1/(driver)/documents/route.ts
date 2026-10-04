import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { requireVerifiedEmail } from "@/lib/infra/require-verified"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"

const driverDocumentSchema = z.object({
  licenseNumber: z.string().regex(/^[A-Za-z0-9-]{8,20}$/),
  licensePhotoUrl: z.url(),
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  await requireVerifiedEmail(userId)
  const user = await db.user.findUnique({ where: { id: userId } })

  if (user?.activeRole !== "DRIVER") {
    throw new AppError("Switch to driver mode to submit a licence", 403)
  }

  const body = await parseJsonBody(request)
  const data = driverDocumentSchema.parse(body)

  const document = await db.driverDocument.create({ data: { ...data, userId } })

  return successResponse(document, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const documents = await db.driverDocument.findMany({ where: { userId } })

  return successResponse(documents)
})
