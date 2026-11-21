"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useExportCsvMutation } from "@/features/admin/api"
import { Tabs, Title, field } from "@/features/admin/ui"

type Kind = "trips" | "users" | "complaints"
type Entry = { id: number; type: string; from: string; to: string; at: string }

const dayMs = 86400000
const dateIn = (ms: number) => new Date(ms + 330 * 60000).toISOString().slice(0, 10)

export function Exports() {
  const t = useTranslations("admin")
  const [kind, setKind] = useState<Kind>("trips")
  const [from, setFrom] = useState(dateIn(Date.now() - 30 * dayMs))
  const [to, setTo] = useState(dateIn(Date.now()))
  const [log, setLog] = useState<Entry[]>([])
  const [fail, setFail] = useState("")
  const [send, sending] = useExportCsvMutation()
  const ok = from < to
  const go = async () => {
    setFail("")
    try {
      const res = await send({ type: kind, from: new Date(`${from}T00:00:00+05:30`).toISOString(), to: new Date(`${to}T23:59:59+05:30`).toISOString() }).unwrap()
      setLog([{ id: Date.now(), type: kind, from: res.from, to: res.to, at: new Date().toISOString() }, ...log])
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Title>{t("nav_exports")}</Title>
      <Tabs value={kind} onChangeAction={setKind} label={t("exportType")} options={[{ id: "trips", label: t("ex_trips") }, { id: "users", label: t("ex_users") }, { id: "complaints", label: t("ex_complaints") }]} />
      <div className="flex flex-wrap items-center gap-2"><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label={t("from")} className={field} /><span className="text-muted">-</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("to")} className={field} /></div>
      <p className="text-muted">{t("exportHelp")}</p>
      <p role="alert" className="min-h-5 text-danger">{fail}</p>
      <Button onClick={go} disabled={!ok || sending.isLoading}>{t("queueExport")}</Button>
      {log.length > 0 && (
        <section className="flex flex-col gap-2"><h2 className="font-semibold">{t("thisSession")}</h2><ul className="flex flex-col gap-2">{log.map((e) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface px-4 py-3"><span>{t(`ex_${e.type}`)} · {stamp(e.from)} - {stamp(e.to)}</span><span className="text-muted">{t("queued")} {stamp(e.at)}</span></li>)}</ul><Link href="/alerts" className="text-primary">{t("openAlerts")}</Link></section>
      )}
    </div>
  )
}
