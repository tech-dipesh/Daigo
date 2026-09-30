import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireStaff } from "@/lib/infra/admin-access"
import { successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"

const querySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
})

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)

  const { status } = querySchema.parse({
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  })
  return successResponse("Vehicle Confirm")
})
