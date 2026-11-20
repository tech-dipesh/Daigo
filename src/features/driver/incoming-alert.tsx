"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { errText } from "@/lib/errors"
import { useDecideMatchMutation, useIncomingQuery } from "@/features/driver/api"
import { enableSound, startSiren } from "@/features/driver/siren"
import { riderApi } from "@/features/rider/api"
import { useCountdown } from "@/features/rider/use-countdown"
import { useAppDispatch } from "@/store"

const total = 75
const fastFor = 15

export function IncomingAlert({ matchId }: { matchId: string }) {
  const t = useTranslations("alert")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const incoming = useIncomingQuery(undefined, { pollingInterval: 4000 })
  const [decide, state] = useDecideMatchMutation()
  const [quiet, setQuiet] = useState(false)
  const [fail, setFail] = useState("")
  const item = incoming.data?.find((x) => x.id === matchId)
  const left = useCountdown(item?.expiresAt)
  const gone = Boolean(incoming.data) && !item
  const fast = (left ?? total) > total - fastFor
  useEffect(() => {
    const stop = startSiren()
    setQuiet(!stop)
    return () => stop?.()
  }, [])
  useEffect(() => {
    if (!gone && left !== 0) return
    const timer = setTimeout(() => router.replace("/driver"), gone ? 1800 : 0)
    return () => clearTimeout(timer)
  }, [gone, left, router])
  const wake = async () => {
    if (await enableSound()) {
      setQuiet(false)
      startSiren()
    }
  }
  const go = async (status: "ACCEPTED" | "REJECTED") => {
    setFail("")
    try {
      await decide({ id: matchId, status }).unwrap()
      if (status === "REJECTED" || !item) return router.replace("/driver")
      const trips = await dispatch(riderApi.endpoints.listTrips.initiate(undefined, { forceRefetch: true })).unwrap()
      const trip = trips.find((x) => x.rideRequestId === item.requestId)
      router.replace(trip ? `/driver/trips/${trip.id}` : "/driver/trips")
    } catch (err) { setFail(errText(err) || t("failed")) }
  }
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-y-auto p-5" role="alertdialog" aria-label={t("title")}>
      <div className={`absolute inset-0 bg-[#E5392B] ${fast ? "siren-fast" : "siren-slow"}`} aria-hidden="true" />
      <div className="relative flex gap-6" aria-hidden="true"><span className="light-red size-8 rounded-full bg-[#E5392B]" /><span className="light-blue size-8 rounded-full bg-[#2563EB]" /></div>
      <section className="relative flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 text-[#1C2433]">
        <p className="text-sm font-medium text-[#5F6B7F]">{t("title")}</p>
        {!item ? <p className="text-lg">{gone ? t("gone") : t("loading")}</p> : (
          <>
            <p className="text-[78px] leading-none font-semibold">₹{item.price}</p>
            <p className="text-[30px] leading-none font-semibold text-[#D92D20]">{t("detour", { km: item.detourKm.toFixed(1) })}</p>
            <p className="text-base">{item.from} - {item.to}</p>
            <p className="text-sm text-[#5F6B7F]">{t("people", { count: item.groupSize })}{item.isVulnerable ? ` · ${t("care")}` : ""} · {t("left", { seconds: left ?? 0 })}</p>
            <button type="button" onClick={() => go("ACCEPTED")} disabled={state.isLoading} className="h-24 rounded-3xl bg-[#15803D] text-[30px] font-semibold text-white outline-hidden disabled:opacity-50">{t("accept")}</button>
            <button type="button" onClick={() => go("REJECTED")} disabled={state.isLoading} className="h-14 rounded-2xl bg-[#D92D20] text-lg font-medium text-white outline-hidden disabled:opacity-50">{t("reject")}</button>
          </>
        )}
        <p role="alert" className="min-h-5 text-sm text-[#D92D20]">{fail}</p>
        {quiet && <button type="button" onClick={wake} className="h-11 rounded-2xl bg-[#DCE6FD] text-sm text-[#1C2433] outline-hidden">{t("soundOff")}</button>}
      </section>
    </main>
  )
}
