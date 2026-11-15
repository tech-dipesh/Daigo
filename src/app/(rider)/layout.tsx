import type { ReactNode } from "react"
import { Shell } from "@/components/shell"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  await requireUser({ role: "RIDER" })
  return <Shell role="rider">{children}</Shell>
}
