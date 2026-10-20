import { z } from "zod"
import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"

const querySchema = z.object({ status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]).default("OPEN") })

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { status } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const complaints = await db.complaint.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: { filedBy: { select: { id: true, email: true, name: true } } },
  })
  return successResponse(complaints)
})
