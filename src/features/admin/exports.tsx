"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useAdminJobMutation, useExportCsvMutation, useExportHistoryQuery } from "@/features/admin/api"
import { State, Tabs, Title, field } from "@/features/admin/ui"

type Kind = "trips" | "users" | "complaints"

const dayMs = 86400000
const dateIn = (ms: number) => new Date(ms + 330 * 60000).toISOString().slice(0, 10)

export function Exports() {
  const t = useTranslations("admin")
  const [kind, setKind] = useState<Kind>("trips")
  const [from, setFrom] = useState(dateIn(Date.now() - 30 * dayMs))
  const [to, setTo] = useState(dateIn(Date.now()))
  const [fail, setFail] = useState("")
  const [note, setNote] = useState("")
  const [send, sending] = useExportCsvMutation()
  const [job, jobbing] = useAdminJobMutation()
  const history = useExportHistoryQuery(undefined, { pollingInterval: 8000 })
  const ok = from < to
  const go = async () => {
    setFail("")
    try {
      await send({ type: kind, from: new Date(`${from}T00:00:00+05:30`).toISOString(), to: new Date(`${to}T23:59:59+05:30`).toISOString() }).unwrap()
    } catch (err) { setFail(errText(err)) }
  }
  const runJob = async (action: "run-autopost" | "schedule-autopost") => {
    setNote("")
    try {
      await job(action).unwrap()
      setNote(t(action === "run-autopost" ? "jobQueued" : "jobScheduled"))
    } catch (err) { setNote(errText(err)) }
  }
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Title>{t("nav_exports")}</Title>
      <Tabs value={kind} onChangeAction={setKind} label={t("exportType")} options={[{ id: "trips", label: t("ex_trips") }, { id: "users", label: t("ex_users") }, { id: "complaints", label: t("ex_complaints") }]} />
      <div className="flex flex-wrap items-center gap-2"><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label={t("from")} className={field} /><span className="text-muted">-</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("to")} className={field} /></div>
      <p className="text-muted">{t("exportHelp")}</p>
      <p role="alert" className="min-h-5 text-danger">{fail}</p>
      <Button onClick={go} disabled={!ok || sending.isLoading}>{t("queueExport")}</Button>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("historyTitle")}</h2>
        <State loading={history.isLoading} error={history.isError} empty={Boolean(history.data) && !history.data?.length} emptyText={t("noExports")} errorText={t("loadFail")} />
        <ul className="flex flex-col gap-2">
          {history.data?.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface px-4 py-3">
              <span className="flex flex-col"><span>{t(`ex_${e.type}`)} · {stamp(e.rangeFrom)} - {stamp(e.rangeTo)}</span><span className="text-sm text-muted">{t("queued")} {stamp(e.createdAt)}</span></span>
              <span className="flex items-center gap-3">
                <span className={e.status === "FAILED" ? "text-danger" : e.status === "READY" ? "text-success" : "text-muted"} title={e.error ?? undefined}>{t(`exs_${e.status}`)}</span>
                {e.url && <a href={e.url} className="text-primary" download>{t("download")}</a>}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{t("jobsTitle")}</h2>
        <p className="text-muted">{t("jobsHelp")}</p>
        <div className="grid gap-2 sm:grid-cols-2"><Button look="quiet" onClick={() => runJob("run-autopost")} disabled={jobbing.isLoading}>{t("runAutopost")}</Button><Button look="quiet" onClick={() => runJob("schedule-autopost")} disabled={jobbing.isLoading}>{t("scheduleAutopost")}</Button></div>
        <p role="status" className="min-h-5 text-sm text-muted">{note}</p>
      </section>
    </div>
  )
}
