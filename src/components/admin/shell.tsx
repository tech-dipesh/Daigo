import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { AdminNav } from "@/components/admin/nav"
import { Prefs } from "@/components/prefs"
import { LogoutButton } from "@/features/auth/logout-button"

export async function AdminShell({ isSuper, children }: { isSuper: boolean; children: ReactNode }) {
  const t = await getTranslations("admin")
  return (
    <div className="flex min-h-dvh flex-col text-sm lg:flex-row">
      <AdminNav isSuper={isSuper} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-3">
          <span className="text-lg font-semibold text-primary">DaiGo <span className="text-sm font-normal text-muted">{isSuper ? t("superAdmin") : t("moderator")}</span></span>
          <div className="flex items-center gap-3"><Prefs /><LogoutButton icon /></div>
        </header>
        <main className="w-full flex-1 px-5 pb-10">{children}</main>
      </div>
    </div>
  )
}
