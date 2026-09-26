import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const emergencyContactSchema = z.object({
  name: z.string().min(3).max(15),
  phone: z.string().regex(/^\d{10}$/),
  isPrimary: z.boolean().default(false),
})

export const POST = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const body = await request.json()
  const data = emergencyContactSchema.parse(body)

  const contact = await db.emergencyContact.create({ data: { ...data, userId } })

  return successResponse(contact, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const contacts = await db.emergencyContact.findMany({ where: { userId } })

  return successResponse(contacts)
})
