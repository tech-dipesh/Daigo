import type { ReactNode } from "react"
import { Shell } from "@/components/shell"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  const s = await requireUser()
  return <Shell role={s.activeRole === "DRIVER" ? "driver" : "rider"}>{children}</Shell>
}
