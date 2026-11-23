"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowIcon, SpinnerIcon } from "@/components/icons"
import { useDriverDashboardQuery, useIncomingQuery, useIncomingRelaysQuery } from "@/features/driver/api"
import { IncomingRow } from "@/features/driver/incoming-row"
import { RelayRow } from "@/features/driver/relay-row"
import { PresenceCard } from "@/features/driver/presence-card"
import { useListLicencesQuery, useListVehiclesQuery } from "@/features/onboarding/api"
import { useAppSelector } from "@/store"

const link = "flex h-14 items-center justify-between rounded-2xl bg-surface px-4 text-ink"

export function DriverHome() {
  const t = useTranslations("driver")
  const away = useAppSelector((s) => s.away.away)
  const dash = useDriverDashboardQuery()
  const incoming = useIncomingQuery(undefined, { pollingInterval: away ? 0 : 6000 })
  const relays = useIncomingRelaysQuery(undefined, { pollingInterval: away ? 0 : 6000 })
  const vehicles = useListVehiclesQuery()
  const licences = useListLicencesQuery()
  const d = dash.data
  const cleared = Boolean(vehicles.data?.some((v) => v.verificationStatus === "APPROVED") && licences.data?.some((l) => l.verificationStatus === "APPROVED"))
  const checked = Boolean(vehicles.data && licences.data)
  return (
    <div className="flex flex-col gap-5">
      <PresenceCard />
      {checked && !cleared && <Link href="/onboarding/driver/review" className="rounded-2xl bg-tint p-4 text-ink">{t("pendingDocs")}</Link>}
      {d && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-surface p-4"><p className="text-sm text-muted">{t("earned")}</p><p className="text-title font-semibold text-success">₹{Math.round(d.totalEarned)}</p></div>
          <div className="rounded-2xl bg-surface p-4"><p className="text-sm text-muted">{t("trips")}</p><p className="text-title font-semibold">{d.completedTrips}</p></div>
          <div className="rounded-2xl bg-surface p-4"><p className="text-sm text-muted">{t("rating")}</p><p className="text-title font-semibold">{d.rating.average ? d.rating.average.toFixed(1) : "-"}</p></div>
        </div>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("requests")}</h2>
        {away && <p className="text-muted">{t("awayNote")}</p>}
        {!away && incoming.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
        {!away && incoming.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
        {!away && incoming.data && relays.data && !incoming.data.length && !relays.data.length && <p className="text-muted">{t("noRequests")}</p>}
        {!away && <ul className="flex flex-col gap-2">{incoming.data?.map((x) => <IncomingRow key={x.id} item={x} />)}{relays.data?.map((x) => <RelayRow key={x.id} item={x} />)}</ul>}
      </section>
      <nav className="flex flex-col gap-2" aria-label={t("shortcuts")}>
        <Link href="/driver/earnings" className={link}>{t("myEarnings")}<ArrowIcon size={18} /></Link>
        <Link href="/driver/routes" className={link}>{t("myRoutes")}<ArrowIcon size={18} /></Link>
        <Link href="/driver/vehicles" className={link}>{t("myVehicles")}<ArrowIcon size={18} /></Link>
        <Link href="/driver/documents" className={link}>{t("myDocuments")}<ArrowIcon size={18} /></Link>
      </nav>
    </div>
  )
}
