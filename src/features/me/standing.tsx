"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useAppealsQuery, useFileAppealMutation, useMeQuery, useWarningHistoryQuery } from "@/features/me/api"

const tone = { OPEN: "text-muted", APPROVED: "text-success", REJECTED: "text-danger" }

function AppealBox({ kind, warningId, onDoneAction }: { kind: "WARNING" | "ACCOUNT"; warningId?: string; onDoneAction: () => void }) {
  const t = useTranslations("me")
  const [file, filing] = useFileAppealMutation()
  const [text, setText] = useState("")
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try {
      await file({ kind, warningId, text: text.trim() }).unwrap()
      onDoneAction()
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-tint p-3">
      <textarea value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={t("appealHint")} aria-label={t("appealHint")} className="min-h-24 rounded-xl bg-surface p-3 text-base text-ink outline-hidden placeholder:text-muted" />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Button onClick={go} disabled={text.trim().length < 20 || filing.isLoading}>{t("sendAppeal")}</Button>
    </div>
  )
}

export function Standing() {
  const t = useTranslations("me")
  const me = useMeQuery()
  const appeals = useAppealsQuery()
  const [history, setHistory] = useState(false)
  const earlier = useWarningHistoryQuery(undefined, { skip: !history })
  const [open, setOpen] = useState("")
  const d = me.data
  const ended = (iso: string | null) => (iso ? stamp(iso) : "")
  if (me.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!d) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  const w = d.warnings
  const items = history && earlier.data ? earlier.data.items : w.items
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-title font-semibold">{t("standing")}</h1>
      {d.isBanned && <section className="flex flex-col gap-2 rounded-3xl bg-danger p-5 text-on-primary"><p className="text-lg font-semibold">{t("banned")}</p><p className="text-sm">{t("bannedHelp")}</p></section>}
      {d.isBanned && <><Button look="quiet" onClick={() => setOpen(open === "account" ? "" : "account")} aria-expanded={open === "account"}>{t("appealAccount")}</Button>{open === "account" && <AppealBox kind="ACCOUNT" onDoneAction={() => setOpen("")} />}</>}
      <div className="rounded-3xl bg-surface p-5"><p className="text-sm text-muted">{t("warnings")}</p><p className="text-fare leading-none font-semibold text-ink">{w.active}<span className="text-title text-muted"> / {w.limit}</span></p>{w.cycleEndsAt && <p className="mt-2 text-sm text-muted">{t("cycleEnds", { time: ended(w.cycleEndsAt) })}</p>}</div>
      {!items.length && <p className="text-muted">{t("noWarnings")}</p>}
      <Button look="quiet" onClick={() => setHistory(!history)} aria-pressed={history}>{t(history ? "currentOnly" : "fullHistory")}</Button>
      {history && earlier.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
      <ul className="flex flex-col gap-2">
        {items.map((x) => (
          <li key={x.id} className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
            <span className="flex items-start justify-between gap-3"><span className="flex flex-col"><span className="text-ink">{x.reason.replaceAll("_", " ").toLowerCase()}</span>{x.note && <span className="text-sm text-muted">{x.note}</span>}<span className="text-xs text-muted">{stamp(x.createdAt)}</span></span>{x.revokedAt && <span className="text-sm text-success">{t("revoked")}</span>}</span>
            {!x.revokedAt && <Button look="quiet" onClick={() => setOpen(open === x.id ? "" : x.id)} aria-expanded={open === x.id}>{t("appeal")}</Button>}
            {open === x.id && <AppealBox kind="WARNING" warningId={x.id} onDoneAction={() => setOpen("")} />}
          </li>
        ))}
      </ul>
      {appeals.data && appeals.data.length > 0 && (
        <section className="flex flex-col gap-2"><h2 className="text-lg font-semibold">{t("yourAppeals")}</h2><ul className="flex flex-col gap-2">{appeals.data.map((a) => <li key={a.id} className="flex flex-col gap-1 rounded-2xl bg-surface p-4"><span className="flex justify-between"><span className="text-ink">{a.kind === "ACCOUNT" ? t("appealAccount") : t("appeal")}</span><span className={`text-sm font-medium ${tone[a.status]}`}>{t(`ap_${a.status}`)}</span></span><span className="text-sm text-muted">{a.text}</span>{a.decisionNote && <span className="text-sm text-ink">{a.decisionNote}</span>}</li>)}</ul></section>
      )}
    </div>
  )
}
