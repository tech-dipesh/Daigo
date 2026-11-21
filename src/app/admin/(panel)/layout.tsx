import type { ReactNode } from "react"
import { AdminShell } from "@/components/admin/shell"
import { Realtime } from "@/features/realtime/realtime"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  const s = await requireUser({ staff: true })
  return <AdminShell isSuper={s.staffRole === "SUPER_ADMIN"}>{children}<Realtime driver={false} /></AdminShell>
}
