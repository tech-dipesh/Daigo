"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { MinusIcon, PlusIcon } from "@/components/icons"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { advanceToUtc, toUtc } from "@/lib/time"
import { useCreateRouteMutation } from "@/features/driver/api"
import { LazyMap } from "@/features/map/map-lazy"
import { useListVehiclesQuery } from "@/features/onboarding/api"
import { PlaceInput } from "@/features/places/place-input"
import { reversePlace } from "@/features/places/search"
import type { Place } from "@/features/places/search"

const order = [1, 2, 3, 4, 5, 6, 0]
const pad = (n: number) => String(n).padStart(2, "0")
const today = () => {
  const d = new Date(Date.now() + 330 * 60000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function RouteForm() {
  const t = useTranslations("driver")
  const router = useRouter()
  const vehicles = useListVehiclesQuery()
  const [create] = useCreateRouteMutation()
  const approved = (vehicles.data ?? []).filter((v) => v.verificationStatus === "APPROVED")
  const [vehicleId, setVehicleId] = useState("")
  const [kind, setKind] = useState<"REGULAR" | "ADVANCE">("REGULAR")
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [target, setTarget] = useState<"from" | "to" | null>(null)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [time, setTime] = useState("09:00")
  const [date, setDate] = useState(today())
  const [detour, setDetour] = useState(2)
  const [seats, setSeats] = useState(1)
  const [fail, setFail] = useState("")
  const vehicle = approved.find((v) => v.id === vehicleId) ?? approved[0]
  const max = vehicle?.seatCapacity ?? 1
  useEffect(() => {
    if (!vehicleId && approved[0]) setVehicleId(approved[0].id)
  }, [approved.length])
  const picked = async (p: { lat: number; lng: number }) => {
    const controller = new AbortController()
    const place = await reversePlace(p.lat, p.lng, controller.signal)
    if (target === "from") setFrom(place)
    if (target === "to") setTo(place)
    setTarget(null)
  }
  const flip = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])
  const ready = Boolean(vehicle && from && to) && /^\d{2}:\d{2}$/.test(time) && (kind === "ADVANCE" ? date >= today() : days.length > 0)
  const go = async () => {
    if (!vehicle || !from || !to) return
    setFail("")
    const utc = kind === "ADVANCE" ? advanceToUtc(date, time) : null
    const reg = toUtc(time, days)
    try {
      await create({ vehicleId: vehicle.id, routeType: kind, fromLabel: from.label, fromLat: from.lat, fromLng: from.lng, toLabel: to.label, toLat: to.lat, toLng: to.lng, daysOfWeek: kind === "REGULAR" ? reg.days : [], departureDate: utc?.date, departureTime: utc?.time ?? reg.time, detourLimitKm: detour, seatsAvailable: Math.min(seats, max) }).unwrap()
      router.push("/driver/routes")
    } catch (err) { setFail(errText(err)) }
  }
  const chip = (on: boolean) => `h-11 rounded-2xl px-4 text-sm outline-hidden ${on ? "bg-primary text-on-primary" : "bg-surface text-ink"}`
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]"><LazyMap from={from} to={to} label={t("mapLabel")} onPickAction={target ? picked : undefined} /></div>
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-semibold">{t("newRoute")}</h1>
        {vehicles.data && !approved.length && <p role="alert" className="rounded-2xl bg-tint p-4 text-ink">{t("needVehicle")}</p>}
        {approved.length > 1 && <select value={vehicle?.id ?? ""} onChange={(e) => setVehicleId(e.target.value)} aria-label={t("vehicle")} className="h-14 rounded-2xl bg-surface px-4 text-base text-ink outline-hidden">{approved.map((v) => <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plateNumber}</option>)}</select>}
        <div role="radiogroup" aria-label={t("kind")} className="grid grid-cols-2 gap-1 rounded-2xl bg-tint p-1">
          {(["REGULAR", "ADVANCE"] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`h-11 rounded-xl text-base font-medium outline-hidden ${kind === k ? "bg-primary text-on-primary" : "text-ink"}`}>{t(k === "REGULAR" ? "regular" : "advance")}</button>)}
        </div>
        <PlaceInput label={t("start")} place={from} onPlaceAction={setFrom} locate />
        <PlaceInput label={t("end")} place={to} onPlaceAction={setTo} />
        <div className="flex gap-2"><button type="button" aria-pressed={target === "from"} onClick={() => setTarget(target === "from" ? null : "from")} className={chip(target === "from")}>{t("tapStart")}</button><button type="button" aria-pressed={target === "to"} onClick={() => setTarget(target === "to" ? null : "to")} className={chip(target === "to")}>{t("tapEnd")}</button></div>
        {kind === "REGULAR" ? <div role="group" aria-label={t("days")} className="flex flex-wrap gap-2">{order.map((d) => <button key={d} type="button" aria-pressed={days.includes(d)} onClick={() => flip(d)} className={chip(days.includes(d))}>{t(`d${d}`)}</button>)}</div> : <input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} aria-label={t("date")} className="h-14 rounded-2xl bg-surface px-4 text-base text-ink outline-hidden" />}
        <label className="flex h-16 items-center justify-between rounded-2xl bg-surface px-4 text-ink">{t("leaveAt")}<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent text-base outline-hidden" /></label>
        <label className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-ink"><span className="flex justify-between">{t("detourLimit")}<span>{detour} km</span></span><input type="range" min={0} max={20} step={0.5} value={detour} onChange={(e) => setDetour(Number(e.target.value))} /></label>
        <div className="flex h-16 items-center justify-between rounded-2xl bg-surface px-4 text-ink">
          {t("seatsFree", { count: Math.min(seats, max) })}
          <span className="flex gap-2">
            <button type="button" disabled={seats <= 1} onClick={() => setSeats(seats - 1)} aria-label={t("fewer")} title={t("fewer")} className="flex size-11 items-center justify-center rounded-xl bg-tint outline-hidden disabled:opacity-50"><MinusIcon size={18} /></button>
            <button type="button" disabled={seats >= max} onClick={() => setSeats(seats + 1)} aria-label={t("more")} title={t("more")} className="flex size-11 items-center justify-center rounded-xl bg-tint outline-hidden disabled:opacity-50"><PlusIcon size={18} /></button>
          </span>
        </div>
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Slide label={t("slideRoute")} lockedLabel={t("lockedRoute")} locked={!ready} onDoneAction={go} />
      </div>
    </div>
  )
}
