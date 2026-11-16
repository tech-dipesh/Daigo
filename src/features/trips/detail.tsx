"use client"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChatIcon, FlagIcon, HelpIcon, SpinnerIcon, UserIcon } from "@/components/icons"
import { trustWord } from "@/lib/trust"
import { LazyMap } from "@/features/map/map-lazy"
import { useMeQuery } from "@/features/me/api"
import { useListRequestsQuery } from "@/features/rider/api"
import { useCounterpartQuery, useGetTripQuery, useLiveQuery } from "@/features/trips/api"
import { CancelPanel } from "@/features/trips/cancel-panel"
import { NoShowForm } from "@/features/trips/noshow-form"
import { SharePanel } from "@/features/trips/share-panel"
import { Timeline } from "@/features/trips/timeline"

const row = "flex h-14 items-center gap-3 rounded-2xl bg-surface px-4 text-ink"

export function TripDetail({ id }: { id: string }) {
  const t = useTranslations("trips")
  const trip = useGetTripQuery(id, { pollingInterval: 5000 })
  const me = useMeQuery()
  const reqs = useListRequestsQuery()
  const data = trip.data
  const active = data?.status === "PENDING_PICKUP" || data?.status === "IN_PROGRESS"
  const live = useLiveQuery(id, { skip: !active, pollingInterval: 5000 })
  const who = useCounterpartQuery(id, { skip: !data })
  const req = reqs.data?.find((r) => r.id === data?.rideRequestId)
  const spot = live.data?.available ? { lat: live.data.lastLat, lng: live.data.lastLng } : null
  const rider = Boolean(data && me.data && data.riderId === me.data.id)
  const waiting = data?.status === "PENDING_PICKUP"
  if (trip.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!data) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]"><LazyMap from={req ? { lat: req.fromLat, lng: req.fromLng } : null} to={req ? { lat: req.toLat, lng: req.toLng } : null} driver={spot} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-semibold">{t(`h_${data.status}`)}</h1>
          <p className="text-muted">₹{data.priceEstimate} · {data.distanceKm.toFixed(1)} km{data.relayLeg ? ` · ${t(data.relayLeg === "FIRST" ? "leg1" : "leg2")}` : ""}</p>
        </div>
        {rider && waiting && data.pickupOtp && (
          <div className="flex flex-col gap-1 rounded-3xl bg-primary p-6 text-on-primary" aria-live="polite">
            <p className="text-sm">{t("pickupCode")}</p>
            <p className="text-fare leading-none font-semibold tracking-widest">{data.pickupOtp}</p>
            <p className="text-sm">{t("pickupHelp")}</p>
          </div>
        )}
        {active && live.data?.available && <p className="rounded-2xl bg-tint px-4 py-3 text-ink">{t("liveLine", { km: live.data.remainingKm, minutes: live.data.etaMinutes })}{live.data.isDeviated ? ` · ${t("deviated")}` : ""}</p>}
        {active && live.data && !live.data.available && <p className="text-sm text-muted">{t("noLive")}</p>}
        {who.data && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
            {who.data.profilePhotoUrl ? <Image src={who.data.profilePhotoUrl} alt="" width={56} height={56} unoptimized className="size-14 rounded-full object-cover" /> : <span className="flex size-14 items-center justify-center rounded-full bg-tint text-muted"><UserIcon size={28} /></span>}
            <span className="flex min-w-0 flex-col"><span className="truncate text-lg font-medium text-ink">{who.data.name}</span><span className="text-sm text-muted">{t(`trust_${trustWord(who.data.trustScore)}`)} · {who.data.trustScore}{who.data.vehicle ? ` · ${who.data.vehicle}` : ""}</span></span>
          </div>
        )}
        <Timeline trip={data} />
        {data.status === "NO_SHOW" && rider && !data.noShowReason && <NoShowForm id={id} />}
        {active && <Link href={`/trips/${id}/chat`} className={row}><ChatIcon size={20} />{t("chat")}</Link>}
        {active && <SharePanel trip={data} />}
        {data.status === "COMPLETED" && rider && <Link href={`/trips/${id}/pay`} className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("payNow")}</Link>}
        {data.status === "COMPLETED" && <Link href={`/trips/${id}/rate`} className={row}>{t("rate")}</Link>}
        {active && <Link href="/emergency" className={`${row} text-danger`}><HelpIcon size={20} />{t("help")}</Link>}
        {active && <CancelPanel id={id} />}
        <Link href={`/trips/${id}/report`} className="flex items-center gap-2 self-start text-sm text-muted"><FlagIcon size={16} />{t("report")}</Link>
      </div>
    </div>
  )
}
