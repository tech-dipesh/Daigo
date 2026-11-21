"use client"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { stamp } from "@/lib/time"
import { useEmergenciesQuery, useResolveEmergencyMutation } from "@/features/admin/api"
import { State, Title } from "@/features/admin/ui"
import { useAppSelector } from "@/store"

export function Emergencies() {
  const t = useTranslations("admin")
  const live = useAppSelector((s) => s.realtime.live)
  const list = useEmergenciesQuery(undefined, { pollingInterval: 5000 })
  const [resolve, resolving] = useResolveEmergencyMutation()
  return (
    <div className="flex flex-col gap-3">
      <Title aside={<span className={`flex items-center gap-2 ${live ? "text-success" : "text-muted"}`}><span className={`size-2 rounded-full ${live ? "bg-success" : "bg-muted"}`} />{live ? t("liveOn") : t("liveOff")}</span>}>{t("nav_emergencies")}</Title>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("noEmergencies")} errorText={t("loadFail")} />
      <ul className="flex flex-col gap-2">
        {list.data?.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger/15 p-4">
            <span className="flex flex-col"><span className="font-medium text-ink">{e.user.name ?? e.user.email}</span><span className="text-muted">{e.user.email} · {stamp(e.createdAt)}</span><a href={`https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lng}#map=16/${e.lat}/${e.lng}`} target="_blank" rel="noopener noreferrer" className="text-primary">{e.lat.toFixed(4)}, {e.lng.toFixed(4)}</a></span>
            <Button onClick={() => resolve(e.id)} disabled={resolving.isLoading}>{t("resolve")}</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
