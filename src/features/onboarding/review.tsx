"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { useListLicencesQuery, useListVehiclesQuery } from "@/features/onboarding/api"

type Row = { id: string; title: string; sub: string; status: "PENDING" | "APPROVED" | "REJECTED"; reason: string | null }

export function Review() {
  const t = useTranslations("onb")
  const vehicles = useListVehiclesQuery()
  const licences = useListLicencesQuery()
  const vehicleRows = (vehicles.data ?? []).map((v): Row => ({ id: v.id, title: `${v.make} ${v.model}`, sub: v.plateNumber, status: v.verificationStatus, reason: v.rejectionReason }))
  const licenceRows = (licences.data ?? []).map((l): Row => ({ id: l.id, title: t("licence"), sub: `${t("ending")} ${l.licenseNumber.slice(-4)}`, status: l.verificationStatus, reason: l.rejectionReason }))
  const rows = [...vehicleRows, ...licenceRows]
  const tone = { PENDING: "text-muted", APPROVED: "text-success", REJECTED: "text-danger" }
  const word = { PENDING: t("statusPending"), APPROVED: t("statusApproved"), REJECTED: t("statusRejected") }
  const loading = vehicles.isLoading || licences.isLoading
  const broken = vehicles.isError || licences.isError
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold">{t("reviewTitle")}</h1>
        <p className="text-muted">{t("reviewSub")}</p>
      </div>
      {loading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {broken && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {!loading && !broken && !rows.length && <p className="text-muted">{t("empty")}</p>}
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
            <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{r.title}</span><span className="truncate text-sm text-muted">{r.sub}</span>{r.reason && <span className="text-sm text-danger">{t("reason", { reason: r.reason })}</span>}</span>
            <span className={`shrink-0 text-sm font-medium ${tone[r.status]}`}>{word[r.status]}</span>
          </li>
        ))}
      </ul>
      <Link href="/" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("continue")}</Link>
    </div>
  )
}
