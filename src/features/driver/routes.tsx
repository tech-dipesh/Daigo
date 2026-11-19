"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronIcon, PlusIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { clockOf, dayMonth, fromUtc } from "@/lib/time"
import { useListRoutesQuery, useRouteStatusMutation } from "@/features/driver/api"
import type { DriverRoute } from "@/features/driver/api"

const names = [0, 1, 2, 3, 4, 5, 6]

export function whenText(r: DriverRoute, days: string[]) {
  const utc = r.departureTime.slice(11, 16)
  const ist = fromUtc(utc, r.daysOfWeek)
  return r.routeType === "ADVANCE" && r.departureDate ? `${dayMonth(`${r.departureDate.slice(0, 10)}T${utc}:00Z`)}, ${clockOf(ist.time)}` : `${[...ist.days].sort().map((d) => days[names.indexOf(d)]).join(", ")} · ${clockOf(ist.time)}`
}

export function RouteList() {
  const t = useTranslations("driver")
  const routes = useListRoutesQuery()
  const [setStatus, busy] = useRouteStatusMutation()
  const days = [t("d0"), t("d1"), t("d2"), t("d3"), t("d4"), t("d5"), t("d6")]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3"><h1 className="text-title font-semibold">{t("myRoutes")}</h1><Link href="/driver/routes/new" className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 font-medium text-on-primary"><PlusIcon size={18} />{t("addRoute")}</Link></div>
      {routes.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {routes.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {routes.data && !routes.data.length && <p className="text-muted">{t("noRoutes")}</p>}
      <ul className="flex flex-col gap-2">
        {routes.data?.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
            <Link href={`/driver/routes/${r.id}`} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{r.fromLabel} - {r.toLabel}</span><span className="text-sm text-muted">{whenText(r, days)} · {t("seats", { count: r.seatsAvailable })}</span></span>
              <span className="flex items-center gap-1 text-sm"><span className={r.status === "ACTIVE" ? "text-success" : "text-muted"}>{t(r.status === "ACTIVE" ? "active" : "paused")}</span><ChevronIcon size={16} /></span>
            </Link>
            <Button look="quiet" disabled={busy.isLoading} onClick={() => setStatus({ id: r.id, status: r.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{t(r.status === "ACTIVE" ? "pause" : "resume")}</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
