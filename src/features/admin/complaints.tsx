"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useDecideComplaintMutation, useComplaintsQuery } from "@/features/admin/api"
import type { AdminComplaint, ComplaintStatus } from "@/features/admin/api"
import { State, Tabs, Title, field } from "@/features/admin/ui"

function Row({ c }: { c: AdminComplaint }) {
  const t = useTranslations("admin")
  const [decide] = useDecideComplaintMutation()
  const [note, setNote] = useState("")
  const [fail, setFail] = useState("")
  const go = async (status: "IN_REVIEW" | "RESOLVED" | "REJECTED") => {
    setFail("")
    try { await decide({ id: c.id, status, note: note.trim() || undefined }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  const btn = "h-9 rounded-xl px-3 outline-hidden"
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium text-ink">{t(`ct_${c.type}`)}</span><span className="text-xs text-muted">{c.filedBy.email} · {stamp(c.createdAt)} · {t("trip")} {c.tripId.slice(0, 8)}</span></div>
      <p className="text-ink">{c.text}</p>
      {c.adminNote && <p className="text-muted">{c.adminNote}</p>}
      {(c.status === "OPEN" || c.status === "IN_REVIEW") && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder={t("note")} aria-label={t("note")} className={`${field} min-w-0 flex-1`} />
          {c.status === "OPEN" && <button type="button" onClick={() => go("IN_REVIEW")} className={`${btn} bg-tint text-ink`}>{t("startReview")}</button>}
          <button type="button" onClick={() => go("RESOLVED")} className={`${btn} bg-success text-on-primary`}>{t("resolve")}</button>
          <button type="button" onClick={() => go("REJECTED")} className={`${btn} bg-danger text-on-primary`}>{t("invalid")}</button>
        </div>
      )}
      <p role="alert" className="min-h-4 text-danger">{fail}</p>
    </li>
  )
}

export function Complaints() {
  const t = useTranslations("admin")
  const [status, setStatus] = useState<ComplaintStatus>("OPEN")
  const list = useComplaintsQuery(status, { pollingInterval: 15000 })
  const opts: { id: ComplaintStatus; label: string }[] = [{ id: "OPEN", label: t("open") }, { id: "IN_REVIEW", label: t("inReview") }, { id: "RESOLVED", label: t("resolved") }, { id: "REJECTED", label: t("invalidTab") }]
  return (
    <div className="flex flex-col gap-3">
      <Title aside={<Tabs value={status} onChangeAction={setStatus} label={t("status")} options={opts} />}>{t("nav_complaints")}</Title>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      <ul className="grid gap-3 lg:grid-cols-2">{list.data?.map((c) => <Row key={c.id} c={c} />)}</ul>
    </div>
  )
}
