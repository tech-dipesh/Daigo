import type { ReactNode } from "react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Prefs } from "@/components/prefs"
import { SosIcon } from "@/components/icons"

export async function Frame({ children }: { children: ReactNode }) {
  const t = await getTranslations("prefs")
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-xl font-semibold text-primary">DaiGo</span>
        <div className="flex items-center gap-2">
          <Prefs />
          <Link href="/emergency" aria-label={t("sos")} title={t("sos")} className="flex size-11 items-center justify-center rounded-2xl bg-surface text-danger"><SosIcon size={22} /></Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 pb-10">{children}</main>
    </div>
  )
}
