import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireUserId } from "@/lib/infra/auth"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const emergencyContactSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(7),
  isPrimary: z.boolean().default(false),
})

export const POST = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const body = await request.json()
  const data = emergencyContactSchema.parse(body)

  const contact = await db.emergencyContact.create({ data: { ...data, userId } })

  return NextResponse.json({ success: true, data: contact, error: null }, { status: 201 })
})

export const GET = withErrorHandling(async (request) => {
  const userId = await requireUserId(request)
  const contacts = await db.emergencyContact.findMany({ where: { userId } })

  return NextResponse.json({ success: true, data: contacts, error: null }, { status: 200 })
})
