"use client"
import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { LazyMap } from "@/features/map/map-lazy"
import { useCancelRequestMutation, useFindMatchesQuery, useJoinWaitlistMutation, useListRequestsQuery, useListTripsQuery, useRetryRequestMutation } from "@/features/rider/api"
import { useCountdown } from "@/features/rider/use-countdown"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"

const total = 75

export function Waiting({ id }: { id: string }) {
  const t = useTranslations("rider")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const reqs = useListRequestsQuery(undefined, { pollingInterval: 3000 })
  const req = reqs.data?.find((r) => r.id === id)
  const matches = useFindMatchesQuery(id)
  const matched = req?.status === "MATCHED"
  const trips = useListTripsQuery(undefined, { skip: !matched })
  const [retry, retrying] = useRetryRequestMutation()
  const [cancel, cancelling] = useCancelRequestMutation()
  const [join, joining] = useJoinWaitlistMutation()
  const left = useCountdown(req?.expiresAt)
  const tripId = matches.data?.autoAccepted?.tripId ?? trips.data?.find((x) => x.rideRequestId === id)?.id
  const notified = (matches.data?.direct.length ?? 0) + (matches.data?.relay.length ?? 0)
  const over = req ? req.status === "EXPIRED" || (req.status === "PENDING" && left === 0) : false
  useEffect(() => {
    if (tripId) router.replace(`/trips/${tripId}`)
  }, [tripId, router])
  const again = async () => {
    try {
      const fresh = await retry(id).unwrap()
      router.replace(`/request/${fresh.id}/waiting`)
    } catch { dispatch(pushToast({ key: "rider.retryFail", kind: "error" })) }
  }
  const wait = async () => {
    try {
      await join(id).unwrap()
      dispatch(pushToast({ key: "rider.waitJoined", kind: "success" }))
      router.push("/home")
    } catch { dispatch(pushToast({ key: "rider.retryFail", kind: "error" })) }
  }
  const stop = async () => {
    try {
      await cancel(id).unwrap()
      router.push("/home")
    } catch { dispatch(pushToast({ key: "rider.retryFail", kind: "error" })) }
  }
  if (reqs.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!req) return <p role="alert" className="mt-10 text-danger">{t("notFound")}</p>
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:h-[calc(100dvh-8rem)]"><LazyMap from={{ lat: req.fromLat, lng: req.fromLng }} to={{ lat: req.toLat, lng: req.toLng }} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-semibold">{over ? t("expiredTitle") : matched ? t("matchedGo") : t("waitTitle")}</h1>
          <p className="text-muted">{req.fromLabel} - {req.toLabel}</p>
        </div>
        {!over && !matched && (
          <>
            <div className="flex flex-col gap-3 rounded-3xl bg-surface p-6" role="timer" aria-live="off">
              <p className="text-fare leading-none font-semibold text-primary">{left ?? total}</p>
              <p className="text-muted">{t("seconds")}</p>
              <div className="h-2 overflow-hidden rounded-full bg-tint"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((left ?? total) / total) * 100}%` }} /></div>
            </div>
            <p className="text-base">{matches.isLoading ? t("searching") : notified ? t("notified", { count: notified }) : t("noneYet")}</p>
            {notified > 0 && <Link href={`/request/${id}/offers`} className="flex h-12 items-center justify-center rounded-2xl bg-tint px-5 font-medium text-ink">{t("seeOffers")}</Link>}
            <Button look="danger" onClick={stop} disabled={cancelling.isLoading}>{t("stop")}</Button>
          </>
        )}
        {over && (
          <>
            <p className="text-muted">{t("expiredSub")}</p>
            <Button onClick={again} disabled={retrying.isLoading}>{t("retry")}</Button>
            <Button look="quiet" onClick={wait} disabled={joining.isLoading}>{t("joinWait")}</Button>
            <Link href="/home" className="text-center text-sm text-muted">{t("backHome")}</Link>
          </>
        )}
      </div>
    </div>
  )
}
