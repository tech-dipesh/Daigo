import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"

export async function requireSuper() {
  const s = await requireUser({ staff: true })
  if (s.staffRole !== "SUPER_ADMIN") redirect("/admin/dashboard")
  return s
}
