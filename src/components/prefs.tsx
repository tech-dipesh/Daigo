"use client"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { MoonIcon, SunIcon } from "@/components/icons"

const year = 60 * 60 * 24 * 365
const langs = [{ id: "en", name: "English" }, { id: "ne", name: "नेपाली" }, { id: "hi", name: "हिन्दी" }]

export function Prefs() {
  const t = useTranslations("prefs")
  const router = useRouter()
  const locale = useLocale()
  const flip = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    document.cookie = `theme=${next}; path=/; max-age=${year}`
  }
  const pick = (id: string) => {
    document.cookie = `lang=${id}; path=/; max-age=${year}`
    router.refresh()
  }
  return (
    <div className="flex items-center gap-2">
      <select value={locale} onChange={(e) => pick(e.target.value)} aria-label={t("language")} title={t("language")} className="h-11 rounded-2xl bg-surface px-3 text-sm text-ink outline-hidden">
        {langs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button type="button" onClick={flip} aria-label={t("theme")} title={t("theme")} className="flex size-11 items-center justify-center rounded-2xl bg-surface text-ink outline-hidden">
        <SunIcon size={20} className="hidden dark:block" />
        <MoonIcon size={20} className="dark:hidden" />
      </button>
    </div>
  )
}
