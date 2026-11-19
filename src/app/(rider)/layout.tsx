import type { ReactNode } from "react"
import { Shell } from "@/components/shell"
import { Realtime } from "@/features/realtime/realtime"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  await requireUser({ role: "RIDER" })
  return <Shell role="rider">{children}<Realtime driver={false} /></Shell>
}
