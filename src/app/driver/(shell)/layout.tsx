import type { ReactNode } from "react"
import { Shell } from "@/components/shell"

export default function Layout({ children }: { children: ReactNode }) {
  return <Shell role="driver">{children}</Shell>
}
