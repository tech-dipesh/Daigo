"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronIcon, SpinnerIcon } from "@/components/icons"
import { useListTripsQuery } from "@/features/rider/api"

const day = (s: string) => new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export function TripList({ base = "/trips" }: { base?: string }) {
  const t = useTranslations("trips")
  const trips = useListTripsQuery()
  const rows = [...(trips.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("listTitle")}</h1>
      {trips.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {trips.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {trips.data && !rows.length && <p className="text-muted">{t("listEmpty")}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((x) => (
          <li key={x.id}>
            <Link href={`${base}/${x.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="flex flex-col"><span className="text-ink">₹{x.priceEstimate} · {x.distanceKm.toFixed(1)} km</span><span className="text-sm text-muted">{day(x.createdAt)}</span></span>
              <span className={`flex items-center gap-1 text-sm font-medium ${x.status === "COMPLETED" ? "text-success" : x.status === "CANCELLED" || x.status === "NO_SHOW" ? "text-danger" : "text-primary"}`}>{t(`s_${x.status}`)}<ChevronIcon size={16} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
