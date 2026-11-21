"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useReviewDocumentMutation, useReviewVehicleMutation, useUploadLinkMutation, useVerificationsQuery } from "@/features/admin/api"
import type { Status3 } from "@/features/admin/api"
import { State, Tabs, Title, field } from "@/features/admin/ui"

function Review({ title, sub, owner, uploadId, status, reason, onReviewAction }: { title: string; sub: string; owner: string; uploadId: string | null; status: Status3; reason: string | null; onReviewAction: (s: "APPROVED" | "REJECTED", reason?: string) => Promise<unknown> }) {
  const t = useTranslations("admin")
  const [link] = useUploadLinkMutation()
  const [note, setNote] = useState("")
  const [fail, setFail] = useState("")
  const view = async () => {
    if (!uploadId) return
    try {
      const res = await link(uploadId).unwrap()
      window.open(res.url, "_blank", "noopener")
    } catch (err) { setFail(errText(err)) }
  }
  const go = async (s: "APPROVED" | "REJECTED") => {
    setFail("")
    try { await onReviewAction(s, note.trim() || undefined) } catch (err) { setFail(errText(err)) }
  }
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><span className="flex flex-col"><span className="font-medium text-ink">{title}</span><span className="text-muted">{sub}</span><span className="text-xs text-muted">{owner}</span></span>{uploadId && <Button look="quiet" className="h-9 px-3 text-sm" onClick={view}>{t("viewPhoto")}</Button>}</div>
      {status === "REJECTED" && reason && <p className="text-danger">{reason}</p>}
      {status === "PENDING" && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder={t("reason")} aria-label={t("reason")} className={`${field} min-w-0 flex-1`} />
          <button type="button" onClick={() => go("APPROVED")} className="h-9 rounded-xl bg-success px-4 text-on-primary outline-hidden">{t("approve")}</button>
          <button type="button" onClick={() => go("REJECTED")} className="h-9 rounded-xl bg-danger px-4 text-on-primary outline-hidden">{t("reject")}</button>
        </div>
      )}
      <p role="alert" className="min-h-4 text-danger">{fail}</p>
    </li>
  )
}

export function Verifications() {
  const t = useTranslations("admin")
  const [status, setStatus] = useState<Status3>("PENDING")
  const list = useVerificationsQuery(status, { pollingInterval: 15000 })
  const [reviewVehicle] = useReviewVehicleMutation()
  const [reviewDoc] = useReviewDocumentMutation()
  const vehicles = list.data?.vehicles ?? []
  const docs = list.data?.documents ?? []
  return (
    <div className="flex flex-col gap-3">
      <Title aside={<Tabs value={status} onChangeAction={setStatus} label={t("status")} options={[{ id: "PENDING", label: t("pending") }, { id: "APPROVED", label: t("approved") }, { id: "REJECTED", label: t("rejected") }]} />}>{t("nav_verifications")}</Title>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !vehicles.length && !docs.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      <ul className="grid gap-3 lg:grid-cols-2">
        {vehicles.map((v) => <Review key={v.id} title={`${v.make} ${v.model} · ${v.plateNumber}`} sub={`${v.type} · RC ${v.rcNumber}`} owner={v.owner.email} uploadId={v.rcUploadId} status={v.verificationStatus} reason={v.rejectionReason} onReviewAction={(s, reason) => reviewVehicle({ id: v.id, status: s, reason }).unwrap()} />)}
        {docs.map((d) => <Review key={d.id} title={`${t("licence")} ${d.licenseNumber}`} sub={t("drivingLicence")} owner={d.user.email} uploadId={d.licenseUploadId} status={d.verificationStatus} reason={d.rejectionReason} onReviewAction={(s, reason) => reviewDoc({ id: d.id, status: s, reason }).unwrap()} />)}
      </ul>
    </div>
  )
}
