"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useReportMutation } from "@/features/trips/api"

const kinds = ["PAYMENT", "ROUTE", "RATING", "CONDUCT", "OTHER"]

export function Report({ id }: { id: string }) {
  const t = useTranslations("trips")
  const [report] = useReportMutation()
  const [type, setType] = useState("")
  const [text, setText] = useState("")
  const [fail, setFail] = useState("")
  const [sent, setSent] = useState(false)
  const ok = Boolean(type) && text.trim().length >= 10
  const go = async () => {
    setFail("")
    try {
      await report({ tripId: id, type, text: text.trim() }).unwrap()
      setSent(true)
    } catch (err) { setFail(errText(err)) }
  }
  if (sent) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-title font-semibold">{t("reportSent")}</h1>
        <p className="text-muted">{t("reportSentSub")}</p>
        <Link href={`/trips/${id}`} className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("backTrip")}</Link>
      </div>
    )
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold">{t("reportTitle")}</h1>
      <div role="radiogroup" aria-label={t("reportType")} className="flex flex-wrap gap-2">
        {kinds.map((k) => <button key={k} type="button" role="radio" aria-checked={type === k} onClick={() => setType(k)} className={`h-11 rounded-2xl px-4 text-sm outline-hidden ${type === k ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{t(`type_${k}`)}</button>)}
      </div>
      <textarea value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={t("reportText")} aria-label={t("reportText")} className="min-h-32 rounded-2xl bg-surface p-4 text-base text-ink outline-hidden placeholder:text-muted" />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideReport")} lockedLabel={t("lockedReport")} locked={!ok} onDoneAction={go} />
    </div>
  )
}
