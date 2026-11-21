"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useAdminAppealsQuery, useDecideAppealMutation } from "@/features/admin/api"
import type { AdminAppeal } from "@/features/admin/api"
import { State, Tabs, Title, field } from "@/features/admin/ui"

function Row({ a }: { a: AdminAppeal }) {
  const t = useTranslations("admin")
  const [decide] = useDecideAppealMutation()
  const [note, setNote] = useState("")
  const [fail, setFail] = useState("")
  const go = async (status: "APPROVED" | "REJECTED") => {
    setFail("")
    try { await decide({ id: a.id, status, note: note.trim() || undefined }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium text-ink">{a.kind === "ACCOUNT" ? t("accountAppeal") : t("warningAppeal")}</span><span className="text-xs text-muted">{a.user.email} · {stamp(a.createdAt)}</span></div>
      <p className="text-ink">{a.text}</p>
      {a.decisionNote && <p className="text-muted">{a.decisionNote}</p>}
      {a.status === "OPEN" && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder={t("note")} aria-label={t("note")} className={`${field} min-w-0 flex-1`} />
          <button type="button" onClick={() => go("APPROVED")} className="h-9 rounded-xl bg-success px-4 text-on-primary outline-hidden">{t("approve")}</button>
          <button type="button" onClick={() => go("REJECTED")} className="h-9 rounded-xl bg-danger px-4 text-on-primary outline-hidden">{t("reject")}</button>
        </div>
      )}
      <p role="alert" className="min-h-4 text-danger">{fail}</p>
    </li>
  )
}

export function Appeals() {
  const t = useTranslations("admin")
  const [status, setStatus] = useState<"OPEN" | "APPROVED" | "REJECTED">("OPEN")
  const list = useAdminAppealsQuery(status, { pollingInterval: 15000 })
  return (
    <div className="flex flex-col gap-3">
      <Title aside={<Tabs value={status} onChangeAction={setStatus} label={t("status")} options={[{ id: "OPEN", label: t("open") }, { id: "APPROVED", label: t("approved") }, { id: "REJECTED", label: t("rejected") }]} />}>{t("nav_appeals")}</Title>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      <ul className="grid gap-3 lg:grid-cols-2">{list.data?.map((a) => <Row key={a.id} a={a} />)}</ul>
    </div>
  )
}
