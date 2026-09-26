import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const driverDocumentSchema = z.object({
  licenseNumber: z.string().regex(/^[A-Za-z0-9-]{8,20}$/),
  licensePhotoUrl: z.url(),
})

export const POST = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const body = await request.json()
  const data = driverDocumentSchema.parse(body)

  const document = await db.driverDocument.create({ data: { ...data, userId } })

  return successResponse(document, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const documents = await db.driverDocument.findMany({ where: { userId } })

  return successResponse(documents)
})
