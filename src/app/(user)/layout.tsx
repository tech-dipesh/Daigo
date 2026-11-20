import type { ReactNode } from "react"
import { Shell } from "@/components/shell"
import { Realtime } from "@/features/realtime/realtime"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  const s = await requireUser({ banned: true })
  const driver = s.activeRole === "DRIVER"
  return <Shell role={driver ? "driver" : "rider"}>{children}<Realtime driver={driver} /></Shell>
}
