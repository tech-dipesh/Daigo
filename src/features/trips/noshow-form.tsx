"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useExplainNoShowMutation } from "@/features/trips/api"

export function NoShowForm({ id }: { id: string }) {
  const t = useTranslations("trips")
  const [explain] = useExplainNoShowMutation()
  const [reason, setReason] = useState("")
  const [fail, setFail] = useState("")
  const ok = reason.trim().length >= 10
  const go = async () => {
    setFail("")
    try { await explain({ id, reason: reason.trim() }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <p className="text-base text-ink">{t("noShowHelp")}</p>
      <textarea value={reason} minLength={10} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder={t("noShowReason")} aria-label={t("noShowReason")} className="min-h-24 rounded-xl bg-tint p-3 text-base text-ink outline-hidden placeholder:text-muted" />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideExplain")} lockedLabel={t("lockedExplain")} locked={!ok} onDoneAction={go} />
    </div>
  )
}
