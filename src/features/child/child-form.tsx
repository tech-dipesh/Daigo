"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { skipToken } from "@reduxjs/toolkit/query"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { metersApart, minApart } from "@/lib/geo"
import { LazyMap } from "@/features/map/map-lazy"
import { PlaceInput } from "@/features/places/place-input"
import type { Place } from "@/features/places/search"
import { useCreateRequestMutation, useEstimateQuery } from "@/features/rider/api"
import { Fare } from "@/features/rider/fare"
import { between } from "@/features/onboarding/rules"

const gaps = { now: 0, in30: 30, in60: 60 }
const windowMinutes = 60

export function ChildForm() {
  const t = useTranslations("child")
  const tr = useTranslations("rider")
  const router = useRouter()
  const [create] = useCreateRequestMutation()
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [when, setWhen] = useState<"now" | "in30" | "in60">("now")
  const [fail, setFail] = useState("")
  const years = Number(age)
  const ageOk = Number.isInteger(years) && years >= 1 && years <= 13
  const close = from && to ? metersApart(from, to) < minApart : false
  const est = useEstimateQuery(from && to && !close ? { fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng, groupSize: 1, minor: "true" } : skipToken)
  const ready = between(name, 3, 15) && ageOk && Boolean(from && to) && !close
  const go = async () => {
    if (!from || !to) return
    setFail("")
    const begin = new Date(Date.now() + gaps[when] * 60000)
    try {
      const made = await create({ fromLabel: from.label, fromLat: from.lat, fromLng: from.lng, toLabel: to.label, toLat: to.lat, toLng: to.lng, windowStart: begin.toISOString(), windowEnd: new Date(begin.getTime() + windowMinutes * 60000).toISOString(), groupSize: 1, hasLuggage: false, isVulnerable: true, womenOnly: false, acOnly: false, allowShared: false, passenger: { name: name.trim(), age: years } }).unwrap()
      router.push(`/request/${made.id}/waiting`)
    } catch (err) { setFail(errText(err)) }
  }
  const chips: { id: typeof when; label: string }[] = [{ id: "now", label: tr("now") }, { id: "in30", label: tr("in30") }, { id: "in60", label: tr("in60") }]
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-64 lg:sticky lg:top-4 lg:h-[calc(100dvh-8rem)]"><LazyMap from={from} to={to} label={tr("mapLabel")} /></div>
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-semibold">{t("title")}</h1>
        <p className="rounded-2xl bg-tint p-4 text-ink">{t("rules")}</p>
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} error={between(name, 3, 15) ? undefined : t("nameBad")} />
        <Input label={t("age")} type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} error={ageOk ? undefined : t("ageBad")} />
        <PlaceInput label={tr("pickup")} place={from} onPlaceAction={setFrom} locate />
        <PlaceInput label={tr("drop")} place={to} onPlaceAction={setTo} />
        <div role="radiogroup" aria-label={tr("when")} className="flex flex-wrap gap-2">{chips.map((c) => <button key={c.id} type="button" role="radio" aria-checked={when === c.id} onClick={() => setWhen(c.id)} className={`h-11 rounded-2xl px-4 text-sm outline-hidden ${when === c.id ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{c.label}</button>)}</div>
        {close && <p role="alert" className="rounded-2xl bg-tint p-4 text-danger">{tr("tooClose")}</p>}
        <Fare data={est.data} picked={null} loading={est.isFetching} failed={est.isError} ready={Boolean(from && to) && !close} />
        <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
        <Slide label={t("slide")} lockedLabel={t("locked")} locked={!ready} onDoneAction={go} />
      </div>
    </div>
  )
}
