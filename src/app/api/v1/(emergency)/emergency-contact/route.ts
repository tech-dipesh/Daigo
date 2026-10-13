import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"

const emergencyContactSchema = z.object({
  name: z.string().min(3).max(15),
  phone: z.string().regex(/^\d{10}$/),
  isPrimary: z.boolean().default(false),
})

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const body = await parseJsonBody(request)
  const data = emergencyContactSchema.parse(body)
  const contact = await db.emergencyContact.create({ data: { ...data, userId } })
  return successResponse(contact, 201)
})

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const contacts = await db.emergencyContact.findMany({ where: { userId } })
  return successResponse(contacts)
})
