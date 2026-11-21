"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useAnalyticsQuery, useStatsQuery } from "@/features/admin/api"
import { LazyBars } from "@/features/admin/charts-lazy"
import { State, Title } from "@/features/admin/ui"

const presets = [7, 30, 90]

const csv = (rows: { day: string; count: number }[], name: string) => {
  const body = ["day,count", ...rows.map((r) => `${r.day},${r.count}`)].join("\n")
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([body], { type: "text/csv" })), download: `${name}.csv` })
  link.click()
  URL.revokeObjectURL(link.href)
}

export function Dashboard() {
  const t = useTranslations("admin")
  const [days, setDays] = useState(30)
  const stats = useStatsQuery()
  const data = useAnalyticsQuery(days)
  const a = data.data
  const s = stats.data
  const kpi = (label: string, value: string) => <div className="rounded-2xl bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-semibold text-ink">{value}</p></div>
  return (
    <div className="flex flex-col gap-4">
      <Title aside={<div className="flex flex-wrap items-center gap-2">{presets.map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={`h-9 rounded-xl px-3 outline-hidden ${days === d ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{t("lastDays", { days: d })}</button>)}<input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))} aria-label={t("customDays")} className="h-9 w-20 rounded-xl bg-surface px-3 text-ink outline-hidden" /></div>}>{t("nav_dashboard")}</Title>
      <State loading={stats.isLoading || data.isLoading} error={stats.isError || data.isError} empty={false} emptyText="" errorText={t("loadFail")} />
      {s && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {kpi(t("users"), String(s.users))}
          {kpi(t("paid"), `₹${Math.round(s.payments.total)} (${s.payments.count})`)}
          {kpi(t("completed"), String(s.trips.COMPLETED ?? 0))}
          {kpi(t("pendingVehicles"), String(s.pendingVerifications.vehicles))}
          {kpi(t("pendingDocs"), String(s.pendingVerifications.documents))}
        </div>
      )}
      {a && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi(t("tripsTotal"), String(a.totalTrips))}
            {kpi(t("cancelRate"), `${Math.round(a.cancellationRate * 1000) / 10}%`)}
            {kpi(t("saved"), `₹${Math.round(a.moneySaved)}`)}
            {kpi(t("activeDrivers"), String(a.activeDrivers))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="flex flex-col gap-2 rounded-2xl bg-surface p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">{t("tripsByDay")}</h2><Button look="quiet" className="h-8 px-3 text-sm" onClick={() => csv(a.tripsByDay, "trips")}>{t("csv")}</Button></div><LazyBars data={a.tripsByDay} tone="primary" /></section>
            <section className="flex flex-col gap-2 rounded-2xl bg-surface p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">{t("emergenciesByDay")}</h2><Button look="quiet" className="h-8 px-3 text-sm" onClick={() => csv(a.emergenciesByDay, "emergencies")}>{t("csv")}</Button></div><LazyBars data={a.emergenciesByDay} tone="danger" /></section>
          </div>
          <p className="text-muted">{t("redemptions", { count: a.coinRedemptions.count, coins: a.coinRedemptions.coins })} · <Link href="/admin/exports" className="text-primary">{t("fullExport")}</Link></p>
        </>
      )}
    </div>
  )
}
