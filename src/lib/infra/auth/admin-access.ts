import type { NextRequest } from "next/server"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError } from "@/lib/infra/http/response"
import * as userRepo from "@/lib/repository/user-repo"

export type Staff = { id: string; staffRole: "MODERATOR" | "SUPER_ADMIN" }

export async function requireStaff(request: NextRequest, only?: "SUPER_ADMIN"): Promise<Staff> {
  const user = await userRepo.staffInfo(getUserId(request))
  if (!user?.staffRole) throw new AppError("Staff access only", 403)
  if (only && user.staffRole !== only) throw new AppError("Super admin access only", 403)
  return { id: user.id, staffRole: user.staffRole }
}
