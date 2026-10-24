import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { verificationQuerySchema } from "@/lib/validation/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { status } = verificationQuerySchema.parse({
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
