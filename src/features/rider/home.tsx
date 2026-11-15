"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowIcon, SpinnerIcon } from "@/components/icons"
import { useListRequestsQuery, useRiderDashboardQuery } from "@/features/rider/api"

const day = (s: string) => new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short" })

export function Home() {
  const t = useTranslations("rider")
  const dash = useRiderDashboardQuery()
  const reqs = useListRequestsQuery()
  const d = dash.data
  const recent = [...(reqs.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  const live = (s: string, e: string | null) => s === "PENDING" && Boolean(e) && new Date(e ?? 0).getTime() > Date.now()
  return (
    <div className="flex flex-col gap-6">
      <Link href="/request/new" className="flex items-center justify-between rounded-3xl bg-primary p-6 text-on-primary">
        <span className="flex flex-col gap-1"><span className="text-display leading-tight font-semibold">{t("homeTitle")}</span><span className="text-base">{t("homeSub")}</span></span>
        <ArrowIcon size={32} />
      </Link>
      {dash.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {dash.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {d && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface p-4"><p className="text-sm text-muted">{t("saved")}</p><p className="text-title font-semibold text-success">₹{Math.round(d.moneySaved)}</p></div>
          <div className="rounded-2xl bg-surface p-4"><p className="text-sm text-muted">{t("tripsTaken")}</p><p className="text-title font-semibold">{d.completedTrips}</p></div>
        </div>
      )}
      {d?.activeTrip && <Link href={`/trips/${d.activeTrip.id}`} className="flex items-center justify-between rounded-2xl bg-tint p-4 text-ink"><span>{t("active")}</span><span className="flex items-center gap-1 text-primary">{t("openTrip")}<ArrowIcon size={16} /></span></Link>}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("requests")}</h2>
        {reqs.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
        {reqs.data && !recent.length && <p className="text-muted">{t("noRequests")}</p>}
        <ul className="flex flex-col gap-2">
          {recent.map((r) => (
            <li key={r.id}>
              <Link href={live(r.status, r.expiresAt) ? `/request/${r.id}/waiting` : "/request/new"} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
                <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{r.fromLabel} - {r.toLabel}</span><span className="text-sm text-muted">{day(r.createdAt)}</span></span>
                <span className={`shrink-0 text-sm font-medium ${r.status === "MATCHED" ? "text-success" : "text-muted"}`}>{t.has(`status${r.status}`) ? t(`status${r.status}`) : r.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-muted">{t("driveNote")} <Link href="/me" className="text-primary">{t("openMe")}</Link></p>
    </div>
  )
}
