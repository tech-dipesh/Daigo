"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { PlusIcon, SpinnerIcon } from "@/components/icons"
import { useListLicencesQuery, useListVehiclesQuery } from "@/features/onboarding/api"

const tone = { PENDING: "text-muted", APPROVED: "text-success", REJECTED: "text-danger" }

export function VehicleList() {
  const t = useTranslations("driver")
  const vehicles = useListVehiclesQuery()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3"><h1 className="text-title font-semibold">{t("myVehicles")}</h1><Link href="/driver/vehicles/new" className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 font-medium text-on-primary"><PlusIcon size={18} />{t("addVehicle")}</Link></div>
      {vehicles.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {vehicles.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {vehicles.data && !vehicles.data.length && <p className="text-muted">{t("noVehicles")}</p>}
      <ul className="flex flex-col gap-2">{vehicles.data?.map((v) => <li key={v.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3"><span className="flex min-w-0 flex-col"><span className="truncate text-ink">{v.make} {v.model}</span><span className="text-sm text-muted">{v.plateNumber} · {t("seats", { count: v.seatCapacity })}{v.rejectionReason ? ` · ${v.rejectionReason}` : ""}</span></span><span className={`shrink-0 text-sm font-medium ${tone[v.verificationStatus]}`}>{t(`st_${v.verificationStatus}`)}</span></li>)}</ul>
    </div>
  )
}

export function DocumentList() {
  const t = useTranslations("driver")
  const docs = useListLicencesQuery()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3"><h1 className="text-title font-semibold">{t("myDocuments")}</h1><Link href="/driver/documents/new" className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 font-medium text-on-primary"><PlusIcon size={18} />{t("addLicence")}</Link></div>
      {docs.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {docs.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {docs.data && !docs.data.length && <p className="text-muted">{t("noDocs")}</p>}
      <ul className="flex flex-col gap-2">{docs.data?.map((d) => <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3"><span className="flex min-w-0 flex-col"><span className="text-ink">{t("licence")}</span><span className="text-sm text-muted">{t("ending", { last: d.licenseNumber.slice(-4) })}{d.rejectionReason ? ` · ${d.rejectionReason}` : ""}</span></span><span className={`shrink-0 text-sm font-medium ${tone[d.verificationStatus]}`}>{t(`st_${d.verificationStatus}`)}</span></li>)}</ul>
    </div>
  )
}
