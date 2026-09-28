import { z } from "zod"
import { db } from "@/lib/infra/db"
import { getUserId } from "@/lib/infra/auth"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, activeRole: true, trustScore: true, createdAt: true },
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return successResponse(user)
})

const roleSchema = z.object({
  role: z.enum(["RIDER", "DRIVER"]),
})

export const PATCH = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const body = await parseJsonBody(request)
  const { role } = roleSchema.parse(body)

  const user = await db.user.update({
    where: { id: userId },
    data: { activeRole: role },
    select: { id: true, email: true, activeRole: true },
  })

  return successResponse(user)
})
