"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { skipToken } from "@reduxjs/toolkit/query"
import { useTranslations } from "next-intl"
import { AutoIcon, BikeIcon, CabIcon, CarIcon, ClockIcon, DownIcon, LuggageIcon, MinusIcon, PeopleIcon, PlusIcon, UpIcon } from "@/components/icons"
import { Slide } from "@/components/ui/slide"
import { Toggle } from "@/components/ui/toggle"
import { errText } from "@/lib/errors"
import { LazyMap } from "@/features/map/map-lazy"
import { PlaceInput } from "@/features/places/place-input"
import type { Place } from "@/features/places/search"
import { useCreateRequestMutation, useEstimateQuery } from "@/features/rider/api"
import { Fare } from "@/features/rider/fare"

const tiles = [{ id: "BIKE", icon: BikeIcon }, { id: "AUTO", icon: AutoIcon }, { id: "CAR", icon: CarIcon }, { id: "CAB", icon: CabIcon }]
const starts = { in30: 30, in60: 60 }
const windowMinutes = 60
const stamp = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export function RequestForm() {
  const t = useTranslations("rider")
  const router = useRouter()
  const [create] = useCreateRequestMutation()
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [when, setWhen] = useState<"now" | "in30" | "in60" | "pick">("now")
  const [custom, setCustom] = useState(stamp(new Date(Date.now() + 3600000)))
  const [anchor, setAnchor] = useState<string | undefined>()
  const [people, setPeople] = useState(1)
  const [luggage, setLuggage] = useState(false)
  const [vehicle, setVehicle] = useState("")
  const [more, setMore] = useState(false)
  const [women, setWomen] = useState(false)
  const [ac, setAc] = useState(false)
  const [shared, setShared] = useState(false)
  const [care, setCare] = useState(false)
  const [notes, setNotes] = useState("")
  const [fail, setFail] = useState("")
  const picked = when === "pick"
  const valid = !Number.isNaN(new Date(custom).getTime())
  const future = picked ? (valid ? new Date(custom).toISOString() : undefined) : anchor
  const begins = () => (picked ? new Date(custom) : anchor ? new Date(Math.max(Date.parse(anchor), Date.now())) : new Date())
  const args = from && to ? { fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng, groupSize: people, when: future } : skipToken
  const est = useEstimateQuery(args)
  const quote = est.data?.quotes.find((q) => q.vehicleType === vehicle) ?? null
  const ready = Boolean(from && to) && (!picked || valid)
  const go = async () => {
    if (!from || !to) return
    setFail("")
    const begin = begins()
    const end = new Date(begin.getTime() + windowMinutes * 60000)
    try {
      const made = await create({ fromLabel: from.label, fromLat: from.lat, fromLng: from.lng, toLabel: to.label, toLat: to.lat, toLng: to.lng, windowStart: begin.toISOString(), windowEnd: end.toISOString(), groupSize: people, hasLuggage: luggage, isVulnerable: care, womenOnly: women, acOnly: ac, allowShared: shared, notes: notes.trim() || undefined, vehiclePreference: vehicle || undefined }).unwrap()
      router.push(`/request/${made.id}/waiting`)
    } catch (err) { setFail(errText(err)) }
  }
  const pick = (id: string) => setVehicle(vehicle === id ? "" : id)
  const chip = (id: typeof when) => {
    setWhen(id)
    setAnchor(id === "in30" || id === "in60" ? new Date(Date.now() + starts[id] * 60000).toISOString() : undefined)
  }
  const chips: { id: typeof when; label: string }[] = [{ id: "now", label: t("now") }, { id: "in30", label: t("in30") }, { id: "in60", label: t("in60") }, { id: "pick", label: t("choose") }]
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]"><LazyMap from={from} to={to} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-semibold">{t("newTitle")}</h1>
        <PlaceInput label={t("pickup")} place={from} onPlace={setFrom} locate />
        <PlaceInput label={t("drop")} place={to} onPlace={setTo} />
        <div role="radiogroup" aria-label={t("when")} className="flex flex-wrap gap-2">
          {chips.map((c) => <button key={c.id} type="button" role="radio" aria-checked={when === c.id} onClick={() => chip(c.id)} className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-sm outline-hidden ${when === c.id ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{c.id === "pick" && <ClockIcon size={16} />}{c.label}</button>)}
        </div>
        {picked && <input type="datetime-local" value={custom} min={stamp(new Date())} onChange={(e) => setCustom(e.target.value)} aria-label={t("choose")} className="h-14 rounded-2xl bg-surface px-4 text-base text-ink outline-hidden" />}
        <div className="flex gap-2">
          <div className="flex h-16 flex-1 items-center justify-between rounded-2xl bg-surface px-4">
            <span className="flex items-center gap-2 text-ink"><PeopleIcon size={20} />{t("people")} {people}</span>
            <span className="flex gap-2">
              <button type="button" disabled={people <= 1} onClick={() => setPeople(people - 1)} aria-label={t("fewer")} title={t("fewer")} className="flex size-10 items-center justify-center rounded-xl bg-tint text-ink outline-hidden disabled:opacity-50"><MinusIcon size={18} /></button>
              <button type="button" disabled={people >= 5} onClick={() => setPeople(people + 1)} aria-label={t("morePeople")} title={t("morePeople")} className="flex size-10 items-center justify-center rounded-xl bg-tint text-ink outline-hidden disabled:opacity-50"><PlusIcon size={18} /></button>
            </span>
          </div>
          <button type="button" role="switch" aria-checked={luggage} onClick={() => setLuggage(!luggage)} aria-label={t("luggage")} title={t("luggage")} className={`flex size-16 items-center justify-center rounded-2xl outline-hidden ${luggage ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}><LuggageIcon size={22} /></button>
        </div>
        <Fare data={est.data} picked={quote} loading={est.isFetching} failed={est.isError} ready={Boolean(from && to)} />
        <div role="radiogroup" aria-label={t("vehicle")} className="grid grid-cols-4 gap-2">
          {tiles.map((v) => {
            const q = est.data?.quotes.find((x) => x.vehicleType === v.id)
            return <button key={v.id} type="button" role="radio" aria-checked={vehicle === v.id} disabled={Boolean(est.data) && !q} onClick={() => pick(v.id)} className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl text-xs outline-hidden disabled:opacity-50 ${vehicle === v.id ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}><v.icon size={24} />{t(v.id)}{q && <span>₹{q.price}</span>}</button>
          })}
        </div>
        <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="flex items-center gap-1 self-start text-sm text-primary outline-hidden">{t("moreOptions")}{more ? <UpIcon size={16} /> : <DownIcon size={16} />}</button>
        {more && (
          <div className="flex flex-col gap-2">
            <Toggle label={t("womenOnly")} on={women} onChange={setWomen} />
            <Toggle label={t("acOnly")} on={ac} onChange={setAc} />
            <Toggle label={t("shared")} on={shared} onChange={setShared} />
            <Toggle label={t("safety")} hint={t("safetyHelp")} on={care} onChange={setCare} />
            <textarea value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} aria-label={t("notes")} className="min-h-24 rounded-2xl bg-surface p-4 text-base text-ink outline-hidden placeholder:text-muted" />
          </div>
        )}
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Slide label={t("slideSend")} lockedLabel={t("lockedSend")} locked={!ready} onDone={go} />
      </div>
    </div>
  )
}
