import type { ReactNode } from "react"
import { AlertWatcher } from "@/features/driver/alert-watcher"
import { Realtime } from "@/features/realtime/realtime"
import { requireUser } from "@/lib/session"

export default async function Layout({ children }: { children: ReactNode }) {
  await requireUser({ role: "DRIVER" })
  return <>{children}<Realtime driver /><AlertWatcher /></>
}
