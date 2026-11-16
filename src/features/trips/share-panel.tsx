"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { CopyIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { useShareTripMutation, useStopShareMutation } from "@/features/trips/api"
import type { TripFull } from "@/features/trips/api"

export function SharePanel({ trip }: { trip: TripFull }) {
  const t = useTranslations("trips")
  const dispatch = useAppDispatch()
  const [share, sharing] = useShareTripMutation()
  const [stop, stopping] = useStopShareMutation()
  const [fail, setFail] = useState("")
  const link = trip.shareToken ? `${window.location.origin}/trips/shared/${trip.shareToken}` : ""
  const start = async () => {
    setFail("")
    try { await share({ id: trip.id, emails: [] }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  const copy = async () => {
    await navigator.clipboard.writeText(link)
    dispatch(pushToast({ key: "trips.copied", kind: "success" }))
  }
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <p className="text-sm text-muted">{t("shareHelp")}</p>
      {link ? (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-tint px-3 py-2"><span className="min-w-0 flex-1 truncate text-sm text-ink">{link}</span><button type="button" onClick={copy} aria-label={t("copy")} title={t("copy")} className="text-primary outline-hidden"><CopyIcon size={18} /></button></div>
          <Button look="quiet" onClick={() => stop(trip.id)} disabled={stopping.isLoading}>{t("stopShare")}</Button>
        </>
      ) : <Button onClick={start} disabled={sharing.isLoading}>{t("startShare")}</Button>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
    </div>
  )
}
