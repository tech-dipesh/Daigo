"use client"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { dayMonth } from "@/lib/time"
import { useDriverDashboardQuery } from "@/features/driver/api"
import { useDriverTripsQuery } from "@/features/driver/trip-api"
import { useMeQuery } from "@/features/me/api"

const days = 7
const offset = 330 * 60000
const dayKey = (ms: number) => new Date(ms + offset).toISOString().slice(0, 10)

export function Earnings() {
  const t = useTranslations("earn")
  const dash = useDriverDashboardQuery()
  const trips = useDriverTripsQuery()
  const me = useMeQuery()
  const mine = (trips.data ?? []).filter((x) => x.status === "COMPLETED" && x.driverId === me.data?.id)
  const today = Date.now()
  const week = Array.from({ length: days }, (_, i) => {
    const ms = today - (days - 1 - i) * 86400000
    const key = dayKey(ms)
    return { key, ms, sum: mine.filter((x) => dayKey(new Date(x.completedAt ?? x.createdAt).getTime()) === key).reduce((a, x) => a + x.priceEstimate, 0) }
  })
  const top = Math.max(1, ...week.map((d) => d.sum))
  const weekSum = week.reduce((a, d) => a + d.sum, 0)
  const d = dash.data
  const avg = d && d.completedTrips ? Math.round(d.totalEarned / d.completedTrips) : 0
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      {(dash.isLoading || trips.isLoading) && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {(dash.isError || trips.isError) && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {d && (
        <div className="rounded-3xl bg-primary p-6 text-on-primary">
          <p className="text-sm">{t("total")}</p>
          <p className="text-fare leading-none font-semibold">₹{Math.round(d.totalEarned)}</p>
          <p className="mt-2 text-sm">{t("sub", { trips: d.completedTrips, avg })}</p>
        </div>
      )}
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4" aria-label={t("week")}>
        <div className="flex items-baseline justify-between"><h2 className="text-lg font-semibold">{t("week")}</h2><span className="text-success">₹{weekSum}</span></div>
        <div className="flex h-40 items-end gap-2">
          {week.map((x) => <div key={x.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-xs text-muted">{x.sum ? `₹${x.sum}` : ""}</span><div className="w-full rounded-t-lg bg-primary" style={{ height: `${Math.max(4, (x.sum / top) * 100)}%`, opacity: x.sum ? 1 : 0.25 }} /><span className="text-xs text-muted">{dayMonth(x.ms).split(" ")[0]}</span></div>)}
        </div>
      </section>
      {d && d.rating.count > 0 && <p className="rounded-2xl bg-surface p-4 text-ink">{t("rated", { avg: (d.rating.average ?? 0).toFixed(1), count: d.rating.count })}</p>}
    </div>
  )
}
