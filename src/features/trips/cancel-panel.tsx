"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useCancelTripMutation } from "@/features/trips/api"

export function CancelPanel({ id }: { id: string }) {
  const t = useTranslations("trips")
  const [cancel, cancelling] = useCancelTripMutation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try { await cancel({ id, reason: reason.trim() || undefined }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  if (!open) return <Button look="danger" onClick={() => setOpen(true)}>{t("cancel")}</Button>
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <p className="text-sm text-muted">{t("cancelHelp")}</p>
      <textarea value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={t("cancelReason")} aria-label={t("cancelReason")} className="min-h-20 rounded-xl bg-tint p-3 text-base text-ink outline-hidden placeholder:text-muted" />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <div className="grid grid-cols-2 gap-2"><Button look="quiet" onClick={() => setOpen(false)}>{t("keepTrip")}</Button><Button look="danger" onClick={go} disabled={cancelling.isLoading}>{t("cancelNow")}</Button></div>
    </div>
  )
}
