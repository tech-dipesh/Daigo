import type { NextRequest } from "next/server"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { demoOn } from "@/lib/infra/demo/config"
import { AppError } from "@/lib/infra/http/response"

export async function requireDemo(request: NextRequest) {
  const staff = await requireStaff(request, "SUPER_ADMIN")
  if (!demoOn()) throw new AppError("Demo mode is off, set DEMO_MODE=true to use the console", 403)
  return staff
}
