"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { DownIcon, SpinnerIcon, UpIcon } from "@/components/icons"
import type { Estimate, Quote } from "@/features/rider/api"

type Props = { data?: Estimate; picked: Quote | null; loading: boolean; failed: boolean; ready: boolean }

export function Fare({ data, picked, loading, failed, ready }: Props) {
  const t = useTranslations("rider")
  const [why, setWhy] = useState(false)
  const quotes = data?.quotes ?? []
  const price = picked?.price ?? Math.min(...quotes.map((q) => q.price))
  const low = picked?.low ?? Math.min(...quotes.map((q) => q.low))
  const high = picked?.high ?? Math.max(...quotes.map((q) => q.high))
  const rows = picked ? [[t("baseRate"), `${picked.breakdown.baseRate}`], [t("area"), `x${picked.breakdown.zone.toFixed(2)}`], [t("timeOfDay"), `x${picked.breakdown.time.toFixed(2)}`], [t("weather"), `x${picked.breakdown.weather.toFixed(2)}`], [t("demand"), `x${picked.breakdown.demand.toFixed(2)}`], [t("group"), `x${picked.breakdown.group.toFixed(2)}`]] : []
  return (
    <section aria-live="polite" className="flex flex-col gap-2 rounded-3xl bg-primary p-6 text-on-primary">
      {!ready && <p className="text-base">{t("fareEmpty")}</p>}
      {ready && loading && <SpinnerIcon size={32} className="animate-spin" />}
      {ready && failed && <p role="alert" className="text-base">{t("fareFail")}</p>}
      {ready && data && quotes.length > 0 && (
        <>
          <p className="text-sm">{picked ? t("fareFor") : t("fareFrom")}</p>
          <p className="text-fare leading-none font-semibold">₹{price}</p>
          <p className="text-base">{t("usually", { low, high })}</p>
          <p className="text-sm">{t("kmMin", { km: data.distanceKm.toFixed(1), minutes: data.minutes })} · {data.zones.pickup} - {data.zones.drop}</p>
          {picked && <button type="button" onClick={() => setWhy(!why)} aria-expanded={why} className="flex items-center gap-1 self-start text-sm font-medium outline-hidden">{t("why")}{why ? <UpIcon size={16} /> : <DownIcon size={16} />}</button>}
          {why && <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">{rows.map(([k, v]) => <div key={k} className="contents"><dt>{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>}
        </>
      )}
    </section>
  )
}
