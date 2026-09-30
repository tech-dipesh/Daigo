import { z } from "zod"
import { db } from "@/lib/infra/db"
import { requireStaff } from "@/lib/infra/admin-access"
import { AppError, successResponse } from "@/lib/infra/response"
import { withErrorHandling } from "@/lib/infra/with-error-handling"
import { parseJsonBody } from "@/lib/infra/request"
import { idFrom } from "@/lib/infra/route-params"

type RouteParams = { params: Promise<{ id: string }> }

const staffRoleSchema = z.object({
  staffRole: z.enum(["MODERATOR", "SUPER_ADMIN"]).nullable(),
})

export const PATCH = withErrorHandling<RouteParams>(async (request, { params }) => {
  const admin = await requireStaff(request, "SUPER_ADMIN")
  const id = await idFrom(params)

  if (id === admin.id) throw new AppError("You can't change your own staff role", 409)

  const { staffRole } = staffRoleSchema.parse(await parseJsonBody(request))

  const user = await db.user.update({
    where: { id },
    data: { staffRole },
    select: { id: true, email: true, staffRole: true },
  })

  return successResponse(user)
})
