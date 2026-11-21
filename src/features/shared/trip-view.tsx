"use client"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { isApiError } from "@/lib/errors"
import { clock } from "@/lib/time"
import { LazyMap } from "@/features/map/map-lazy"
import { useSharedQuery } from "@/features/shared/api"

export function SharedTrip({ token }: { token: string }) {
  const t = useTranslations("shared")
  const tt = useTranslations("trips")
  const q = useSharedQuery(token, { pollingInterval: 5000 })
  const d = q.data
  if (q.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!d) return <div className="flex flex-col gap-2"><h1 className="text-title font-semibold">{t("ended")}</h1><p role="alert" className="text-muted">{isApiError(q.error) ? q.error.message : t("loadFail")}</p></div>
  const spot = d.lastLat !== null && d.lastLng !== null ? { lat: d.lastLat, lng: d.lastLng } : null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1"><h1 className="text-title font-semibold">{tt(`h_${d.status}`)}</h1><p className="text-muted">{t("vehicle", { vehicle: d.vehicle })}</p></div>
      <div className="h-80"><LazyMap driver={spot} label={t("mapLabel")} /></div>
      {d.etaMinutes !== null && <p className="rounded-2xl bg-tint px-4 py-3 text-ink">{t("eta", { minutes: d.etaMinutes })}</p>}
      {d.isDeviated && <p role="alert" className="rounded-2xl bg-surface px-4 py-3 text-danger">{t("deviated")}</p>}
      <p className="text-sm text-muted">{spot && d.lastLocationAt ? t("updated", { time: clock(d.lastLocationAt) }) : t("noLocation")}</p>
    </div>
  )
}
