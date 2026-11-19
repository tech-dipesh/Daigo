"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { clock } from "@/lib/time"
import { nextMorning } from "@/lib/time"
import { useAppDispatch, useAppSelector } from "@/store"
import { comeBack, goAway } from "@/store/away"

const options = [
  { key: "m15", until: () => Date.now() + 15 * 60000 },
  { key: "h1", until: () => Date.now() + 60 * 60000 },
  { key: "tomorrow", until: () => nextMorning() },
  { key: "always", until: () => null },
]

export function PresenceCard() {
  const t = useTranslations("driver")
  const dispatch = useAppDispatch()
  const away = useAppSelector((s) => s.away.away)
  const live = useAppSelector((s) => s.realtime.live)
  const [open, setOpen] = useState(false)
  const pick = (until: number | null) => {
    dispatch(goAway(until))
    setOpen(false)
  }
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={`size-3 rounded-full ${away ? "bg-muted" : "bg-success"}`} />
        <span className="flex flex-col"><span className="text-lg font-semibold text-ink">{away ? t("offline") : t("online")}</span><span className="text-sm text-muted">{away ? (away.until ? t("offlineUntil", { time: clock(away.until) }) : t("offlineAlways")) : live ? t("onlineSub") : t("connecting")}</span></span>
      </div>
      {away ? <Button onClick={() => dispatch(comeBack())}>{t("goOnline")}</Button> : <Button look="quiet" onClick={() => setOpen(!open)} aria-expanded={open}>{t("goOffline")}</Button>}
      {open && !away && <ul className="grid gap-2">{options.map((o) => <li key={o.key}><button type="button" onClick={() => pick(o.until())} className="h-12 w-full rounded-2xl bg-tint px-4 text-left text-ink outline-hidden">{t(`off_${o.key}`)}</button></li>)}</ul>}
    </section>
  )
}
