import type { NextRequest } from "next/server"
import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError } from "@/lib/infra/http/response"

export async function requireStaff(request: NextRequest, only?: "SUPER_ADMIN") {
  const user = await db.user.findUnique({
    where: { id: getUserId(request) },
    select: { id: true, staffRole: true },
  })

  if (!user?.staffRole) throw new AppError("Staff access only", 403)
  if (only && user.staffRole !== only) throw new AppError("Super admin access only", 403)

  return user
}
