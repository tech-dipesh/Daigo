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
  const where = { verificationStatus: status }
  const [vehicles, documents] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: { owner: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.driverDocument.findMany({
      where,
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])
  return successResponse({ vehicles, documents })
})
