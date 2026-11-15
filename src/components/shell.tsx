import type { ReactNode } from "react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Nav } from "@/components/nav"
import { Prefs } from "@/components/prefs"
import { SosIcon } from "@/components/icons"

export async function Shell({ role, children }: { role: "rider" | "driver"; children: ReactNode }) {
  const t = await getTranslations("prefs")
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Nav role={role} />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between px-5 py-4">
          <span className="text-xl font-semibold text-primary">DaiGo</span>
          <div className="flex items-center gap-2">
            <Prefs />
            <Link href="/emergency" aria-label={t("sos")} title={t("sos")} className="flex size-11 items-center justify-center rounded-2xl bg-surface text-danger"><SosIcon size={22} /></Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-8">{children}</main>
      </div>
    </div>
  )
}
