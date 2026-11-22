"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { useMeQuery } from "@/features/me/api"
import { useSosMutation } from "@/features/safety/api"

type Phase = "idle" | "locating" | "sent" | "noLocation" | "failed"

export function SosPanel({ tripId }: { tripId?: string }) {
  const t = useTranslations("emergency")
  const me = useMeQuery()
  const [send, sending] = useSosMutation()
  const [phase, setPhase] = useState<Phase>("idle")
  const busy = phase === "locating" || sending.isLoading
  const raise = () => {
    setPhase("locating")
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await send({ lat: coords.latitude, lng: coords.longitude, tripId }).unwrap()
          setPhase("sent")
        } catch { setPhase("failed") }
      },
      () => setPhase("noLocation"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    )
  }
  if (me.isLoading) return <SpinnerIcon size={24} className="animate-spin text-muted" />
  if (!me.data) return <p className="text-muted">{t("needLogin")}</p>
  return (
    <section className="flex flex-col gap-3" aria-live="assertive">
      {phase !== "sent" && <button type="button" onClick={raise} disabled={busy} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-tint px-5 text-lg font-medium text-danger outline-hidden disabled:opacity-60">{busy && <SpinnerIcon size={20} className="animate-spin" />}{busy ? t("sending") : t("send")}</button>}
      {tripId && phase === "idle" && <p className="text-sm text-muted">{t("tripNote")}</p>}
      {phase === "sent" && <p className="rounded-2xl bg-tint p-4 text-ink">{t("sent")}</p>}
      {phase === "noLocation" && <p role="alert" className="text-danger">{t("noLocation")}</p>}
      {phase === "failed" && <p role="alert" className="text-danger">{t("failed")}</p>}
    </section>
  )
}
