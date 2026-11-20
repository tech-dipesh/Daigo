"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Avatar } from "@/components/avatar"
import { ChevronIcon, SpinnerIcon } from "@/components/icons"
import { Toggle } from "@/components/ui/toggle"
import { errText } from "@/lib/errors"
import { LogoutButton } from "@/features/auth/logout-button"
import { TrustRing } from "@/features/me/trust-ring"
import { useMeQuery, usePatchMeMutation } from "@/features/me/api"

const langs = [{ id: "EN", cookie: "en", name: "English" }, { id: "NE", cookie: "ne", name: "नेपाली" }, { id: "HI", cookie: "hi", name: "हिन्दी" }] as const
const row = "flex h-14 items-center justify-between rounded-2xl bg-surface px-4 text-ink"
const year = 60 * 60 * 24 * 365

export function MeHub() {
  const t = useTranslations("me")
  const router = useRouter()
  const me = useMeQuery()
  const [patch, patching] = usePatchMeMutation()
  const [fail, setFail] = useState("")
  const d = me.data
  const drive = d?.activeRole === "DRIVER"
  const switchMode = async (on: boolean) => {
    setFail("")
    try {
      await patch({ role: on ? "DRIVER" : "RIDER" }).unwrap()
      router.replace("/")
      router.refresh()
    } catch (err) { setFail(errText(err)) }
  }
  const pick = async (lang: (typeof langs)[number]) => {
    document.cookie = `lang=${lang.cookie}; path=/; max-age=${year}`
    await patch({ language: lang.id })
    router.refresh()
  }
  if (me.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!d) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-4 rounded-3xl bg-surface p-5">
        <Avatar id={d.id} size={64} />
        <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-lg font-semibold text-ink">{d.name ?? t("noName")}</span><span className="truncate text-sm text-muted">{d.email}</span></span>
        <TrustRing score={d.trustScore} />
      </div>
      <Toggle label={t("driveMode")} hint={t("driveHint")} on={drive} onChangeAction={switchMode} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <div role="radiogroup" aria-label={t("language")} className="grid grid-cols-3 gap-1 rounded-2xl bg-tint p-1">
        {langs.map((l) => <button key={l.id} type="button" role="radio" aria-checked={d.language === l.id} disabled={patching.isLoading} onClick={() => pick(l)} className={`h-11 rounded-xl text-base font-medium outline-hidden ${d.language === l.id ? "bg-primary text-on-primary" : "text-ink"}`}>{l.name}</button>)}
      </div>
      <nav className="flex flex-col gap-2" aria-label={t("account")}>
        <Link href="/me/profile" className={row}>{t("editProfile")}<ChevronIcon size={18} /></Link>
        <Link href="/me/emergency-contact" className={row}>{t("contacts")}<ChevronIcon size={18} /></Link>
        <Link href="/me/standing" className={row}><span>{t("standing")}{d.warnings.active > 0 ? ` (${d.warnings.active}/${d.warnings.limit})` : ""}</span><ChevronIcon size={18} /></Link>
        <Link href="/terms" className={row}>{t("terms")}<ChevronIcon size={18} /></Link>
        <Link href="/me/delete" className={`${row} text-danger`}>{t("delete")}<ChevronIcon size={18} /></Link>
      </nav>
      <LogoutButton />
    </div>
  )
}
