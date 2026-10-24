import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { appealListQuerySchema } from "@/lib/validation/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { status } = appealListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const appeals = await db.appeal.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, email: true, name: true } }, warning: true },
  })
  return successResponse(appeals)
})
