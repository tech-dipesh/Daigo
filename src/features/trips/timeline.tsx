import { useTranslations } from "next-intl"
import { CheckIcon, DotIcon } from "@/components/icons"
import type { TripFull } from "@/features/trips/api"

export function Timeline({ trip }: { trip: TripFull }) {
  const t = useTranslations("trips")
  const going = trip.status === "IN_PROGRESS" || trip.status === "COMPLETED"
  const steps = [
    { key: "tlFound", done: true },
    { key: "tlArrived", done: Boolean(trip.arrivedAt) || going },
    { key: "tlStarted", done: going },
    { key: "tlDone", done: trip.status === "COMPLETED" },
  ]
  const next = steps.findIndex((s) => !s.done)
  const ended = trip.status === "CANCELLED" || trip.status === "NO_SHOW"
  return (
    <ol className="flex flex-col gap-3" aria-label={t("timeline")}>
      {steps.map((s, i) => (
        <li key={s.key} className={`flex items-center gap-3 ${s.done ? "text-ink" : i === next && !ended ? "text-primary" : "text-muted"}`}>
          <span className={`flex size-6 items-center justify-center rounded-full ${s.done ? "bg-success text-surface" : "bg-tint"}`}>{s.done ? <CheckIcon size={14} /> : <DotIcon size={10} />}</span>
          {t(s.key)}
        </li>
      ))}
      {ended && <li className="flex items-center gap-3 text-danger">{t(`s_${trip.status}`)}</li>}
    </ol>
  )
}
