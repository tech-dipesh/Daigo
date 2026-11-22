"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChatIcon, HelpIcon, SpinnerIcon, UserIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { trustWord } from "@/lib/trust"
import { CodeBoxes } from "@/features/auth/code-boxes"
import { CashProof } from "@/features/driver/cash-proof"
import { useArrivedMutation, useCompleteTripMutation, useDriverTripQuery, useFirstLegLateMutation, useNoShowMutation, useTripPlacesQuery, useVerifyPickupMutation } from "@/features/driver/trip-api"
import { useShareLocation } from "@/features/driver/use-share-location"
import { LazyMap } from "@/features/map/map-lazy"
import { useCountdown } from "@/features/rider/use-countdown"
import { useCounterpartQuery, useGetPaymentQuery } from "@/features/trips/api"
import { CancelPanel } from "@/features/trips/cancel-panel"
import { Timeline } from "@/features/trips/timeline"

const row = "flex h-14 items-center gap-3 rounded-2xl bg-surface px-4 text-ink"
const waitMs = 5 * 60000
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export function DriverTrip({ id }: { id: string }) {
  const t = useTranslations("dtrip")
  const tt = useTranslations("trips")
  const trip = useDriverTripQuery(id, { pollingInterval: 5000 })
  const places = useTripPlacesQuery(id)
  const who = useCounterpartQuery(id, { skip: !trip.data })
  const data = trip.data
  const active = data?.status === "PENDING_PICKUP" || data?.status === "IN_PROGRESS"
  const pay = useGetPaymentQuery(id, { skip: data?.status !== "COMPLETED" })
  const sharing = useShareLocation(id, active)
  const [arrive, arriving] = useArrivedMutation()
  const [verify] = useVerifyPickupMutation()
  const [finish] = useCompleteTripMutation()
  const [skip, skipping] = useNoShowMutation()
  const [late, lating] = useFirstLegLateMutation()
  const [otp, setOtp] = useState("")
  const [fail, setFail] = useState("")
  const wait = useCountdown(data?.arrivedAt ? new Date(new Date(data.arrivedAt).getTime() + waitMs).toISOString() : null)
  const spot = places.data
  const run = async (job: () => Promise<unknown>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err)) }
  }
  if (trip.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!data) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  const pending = data.status === "PENDING_PICKUP"
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]"><LazyMap from={spot ? { lat: spot.fromLat, lng: spot.fromLng } : null} to={spot ? { lat: spot.toLat, lng: spot.toLng } : null} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-semibold">{tt(`h_${data.status}`)}</h1>
          <p className="text-muted">₹{data.priceEstimate}{data.relayLeg ? ` · ${tt(data.relayLeg === "FIRST" ? "leg1" : "leg2")}` : ""}</p>
        </div>
        {spot && <div className="flex flex-col gap-1 rounded-2xl bg-surface p-4"><p className="text-xs text-muted">{t("pickupAt")}</p><p className="text-base text-ink">{spot.fromLabel}</p><p className="mt-2 text-xs text-muted">{t("dropAt")}</p><p className="text-base text-ink">{spot.toLabel}</p></div>}
        {who.data && (
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-tint text-muted"><UserIcon size={28} /></span>
            <span className="flex min-w-0 flex-col"><span className="truncate text-lg font-medium text-ink">{who.data.name}</span><span className="text-sm text-muted">{tt(`trust_${trustWord(who.data.trustScore)}`)} · {who.data.trustScore}</span></span>
          </div>
        )}
        {active && <p className={`rounded-2xl px-4 py-3 text-sm ${sharing === "sharing" ? "bg-tint text-ink" : "bg-surface text-danger"}`}>{sharing === "sharing" ? t("sharingOn") : sharing === "denied" ? t("sharingDenied") : t("sharingWait")}</p>}
        {pending && !data.arrivedAt && <Button onClick={() => run(() => arrive(id).unwrap())} disabled={arriving.isLoading}>{t("arrived")}</Button>}
        {pending && data.arrivedAt && (
          <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
            <p className="text-base text-ink">{t("askCode")}</p>
            <CodeBoxes value={otp} onChangeAction={setOtp} label={t("codeLabel")} />
            <Slide label={t("slideStart")} lockedLabel={t("lockedStart")} locked={otp.length < 6} onDoneAction={() => run(() => verify({ id, otp }).unwrap())} />
            {wait !== null && wait > 0 && <p className="text-sm text-muted">{t("waitLeft", { time: mmss(wait) })}</p>}
            {wait === 0 && <Button look="danger" onClick={() => run(() => skip(id).unwrap())} disabled={skipping.isLoading}>{t("noShow")}</Button>}
          </div>
        )}
        {data.status === "IN_PROGRESS" && <Slide label={t("slideDone")} lockedLabel={t("slideDone")} locked={false} onDoneAction={() => run(() => finish(id).unwrap())} />}
        {data.status === "COMPLETED" && (
          <div className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
            <p className="text-lg font-semibold text-success">₹{data.priceEstimate}</p>
            <p className="text-sm text-muted">{pay.data ? (pay.data.status === "PAID" ? t("paid") : pay.data.method === "CASH" ? t("collectCash") : t("waitPay")) : t("waitPay")}</p>
          </div>
        )}
        {pay.data?.method === "CASH" && pay.data.status !== "PAID" && <CashProof id={id} />}
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Timeline trip={data} />
        {active && <Link href={`/trips/${id}/chat`} className={row}><ChatIcon size={20} />{tt("chat")}</Link>}
        {data.status === "COMPLETED" && <Link href={`/trips/${id}/rate`} className={row}>{tt("rate")}</Link>}
        {pending && data.relayLeg === "SECOND" && <Button look="quiet" onClick={() => run(() => late(id).unwrap())} disabled={lating.isLoading}>{t("firstLate")}</Button>}
        {active && <Link href={`/emergency?trip=${id}`} className={`${row} text-danger`}><HelpIcon size={20} />{tt("help")}</Link>}
        {active && <CancelPanel id={id} />}
        <Link href={`/trips/${id}/report`} className="self-start text-sm text-muted">{tt("report")}</Link>
      </div>
    </div>
  )
}
