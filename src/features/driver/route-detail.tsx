"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { useAutoAcceptMutation, useListRoutesQuery, useRouteStatusMutation } from "@/features/driver/api"
import { whenText } from "@/features/driver/routes"
import { LazyMap } from "@/features/map/map-lazy"

const box = "h-14 w-full rounded-2xl bg-tint px-4 text-base text-ink outline-hidden"

export function RouteDetail({ id }: { id: string }) {
  const t = useTranslations("driver")
  const dispatch = useAppDispatch()
  const routes = useListRoutesQuery()
  const [save, saving] = useAutoAcceptMutation()
  const [setStatus] = useRouteStatusMutation()
  const route = routes.data?.find((r) => r.id === id)
  const [on, setOn] = useState(false)
  const [price, setPrice] = useState("")
  const [perKm, setPerKm] = useState("")
  const [trust, setTrust] = useState("")
  const [fail, setFail] = useState("")
  useEffect(() => {
    if (!route) return
    setOn(route.autoAccept)
    setPrice(route.autoMinPrice?.toString() ?? "")
    setPerKm(route.autoMinPerKm?.toString() ?? "")
    setTrust(route.autoMinTrust?.toString() ?? "")
  }, [route?.id, route?.autoAccept])
  const days = [t("d0"), t("d1"), t("d2"), t("d3"), t("d4"), t("d5"), t("d6")]
  const go = async () => {
    setFail("")
    try {
      await save({ id, enabled: on, minPrice: price ? Number(price) : undefined, minPerKm: perKm ? Number(perKm) : undefined, minTrust: trust ? Number(trust) : undefined }).unwrap()
      dispatch(pushToast({ key: "driver.saved", kind: "success" }))
    } catch (err) { setFail(errText(err)) }
  }
  if (routes.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!route) return <p role="alert" className="mt-10 text-danger">{t("routeMissing")}</p>
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:h-[calc(100dvh-8rem)]"><LazyMap from={{ lat: route.fromLat, lng: route.fromLng }} to={{ lat: route.toLat, lng: route.toLng }} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1"><h1 className="text-title font-semibold">{route.fromLabel} - {route.toLabel}</h1><p className="text-muted">{whenText(route, days)} · {t("detour", { km: route.detourLimitKm })} · {t("seats", { count: route.seatsAvailable })}</p></div>
        <Button look="quiet" onClick={() => setStatus({ id, status: route.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{t(route.status === "ACTIVE" ? "pause" : "resume")}</Button>
        <h2 className="text-lg font-semibold">{t("autoTitle")}</h2>
        <p className="text-sm text-muted">{t("autoHelp")}</p>
        <Toggle label={t("autoOn")} on={on} onChangeAction={setOn} />
        {on && (
          <div className="flex flex-col gap-2">
            <input type="number" inputMode="numeric" min={0} max={2000} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("minPrice")} aria-label={t("minPrice")} className={box} />
            <input type="number" inputMode="decimal" min={0} max={40} step={0.5} value={perKm} onChange={(e) => setPerKm(e.target.value)} placeholder={t("minPerKm")} aria-label={t("minPerKm")} className={box} />
            <input type="number" inputMode="numeric" min={0} max={100} value={trust} onChange={(e) => setTrust(e.target.value)} placeholder={t("minTrust")} aria-label={t("minTrust")} className={box} />
          </div>
        )}
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Button onClick={go} disabled={saving.isLoading}>{t("save")}</Button>
        <Link href="/driver/routes" className="text-center text-sm text-primary">{t("backRoutes")}</Link>
      </div>
    </div>
  )
}
