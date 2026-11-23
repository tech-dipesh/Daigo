"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { CrossIcon, MinusIcon, PlusIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { clockOf, fromUtc, toUtc } from "@/lib/time"
import { PlaceInput } from "@/features/places/place-input"
import type { Place } from "@/features/places/search"
import { useRiddenQuery, useAddSavedMutation, useAddWeekdayMutation, useCancelWeekdayMutation, usePostTodayMutation, useRemoveSavedMutation, useRequestSavedMutation, useSavedQuery, useWeekdayQuery } from "@/features/routines/api"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"

const order = [1, 2, 3, 4, 5, 6, 0]
const tile = "h-12 rounded-2xl bg-surface px-3 text-base text-ink outline-hidden"
const chip = (on: boolean) => `h-11 rounded-2xl px-4 text-sm outline-hidden ${on ? "bg-primary text-on-primary" : "bg-surface text-ink"}`

function People({ value, onChangeAction }: { value: number; onChangeAction: (n: number) => void }) {
  const t = useTranslations("routines")
  return (
    <div className="flex h-14 items-center justify-between rounded-2xl bg-surface px-4 text-ink">
      {t("people", { count: value })}
      <span className="flex gap-2">
        <button type="button" disabled={value <= 1} onClick={() => onChangeAction(value - 1)} aria-label={t("fewer")} title={t("fewer")} className="flex size-11 items-center justify-center rounded-xl bg-tint outline-hidden disabled:opacity-50"><MinusIcon size={18} /></button>
        <button type="button" disabled={value >= 5} onClick={() => onChangeAction(value + 1)} aria-label={t("more")} title={t("more")} className="flex size-11 items-center justify-center rounded-xl bg-tint outline-hidden disabled:opacity-50"><PlusIcon size={18} /></button>
      </span>
    </div>
  )
}

export function Routines() {
  const t = useTranslations("routines")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const saved = useSavedQuery()
  const weekday = useWeekdayQuery()
  const ridden = useRiddenQuery()
  const [addSaved, addingSaved] = useAddSavedMutation()
  const [removeSaved] = useRemoveSavedMutation()
  const [requestSaved, requesting] = useRequestSavedMutation()
  const [addWeekday, addingWeek] = useAddWeekdayMutation()
  const [cancelWeekday] = useCancelWeekdayMutation()
  const [postToday, posting] = usePostTodayMutation()
  const [formS, setFormS] = useState(false)
  const [formW, setFormW] = useState(false)
  const [label, setLabel] = useState("")
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [people, setPeople] = useState(1)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("10:00")
  const [pref, setPref] = useState("")
  const [fail, setFail] = useState("")
  const names = [t("d0"), t("d1"), t("d2"), t("d3"), t("d4"), t("d5"), t("d6")]
  const utcStart = toUtc(start, days)
  const utcEnd = toUtc(end, days)
  const windowOk = utcEnd.time > utcStart.time
  const run = async (job: () => Promise<unknown>) => {
    setFail("")
    try { await job() } catch (err) { setFail(errText(err)) }
  }
  const place = from && to ? { fromLabel: from.label, fromLat: from.lat, fromLng: from.lng, toLabel: to.label, toLat: to.lat, toLng: to.lng, groupSize: people } : null
  const saveSaved = () => run(async () => {
    if (!place) return
    await addSaved({ ...place, label: label.trim() }).unwrap()
    setFormS(false)
    setLabel("")
  })
  const saveWeekday = () => run(async () => {
    if (!place) return
    await addWeekday({ ...place, daysOfWeek: utcStart.days, windowStart: utcStart.time, windowEnd: utcEnd.time, preferredDriverId: pref || undefined }).unwrap()
    setFormW(false)
    setPref("")
  })
  const oneTap = (id: string) => run(async () => {
    const made = await requestSaved(id).unwrap()
    router.push(`/request/${made.id}/waiting`)
  })
  const today = (id: string) => run(async () => {
    const made = await postToday(id).unwrap()
    dispatch(pushToast({ key: "routines.posted", kind: "success" }))
    router.push(`/request/${made.id}/waiting`)
  })
  const flip = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])
  const shown = (w: { daysOfWeek: number[]; windowStartTime: string; windowEndTime: string }) => {
    const a = fromUtc(w.windowStartTime.slice(11, 16), w.daysOfWeek)
    const b = fromUtc(w.windowEndTime.slice(11, 16), w.daysOfWeek)
    return `${[...a.days].sort().map((d) => names[d]).join(", ")} · ${clockOf(a.time)} - ${clockOf(b.time)}`
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{t("savedTitle")}</h2><Button look="quiet" onClick={() => setFormS(!formS)} aria-expanded={formS}>{t("add")}</Button></div>
        {saved.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
        {saved.data && !saved.data.length && !formS && <p className="text-muted">{t("savedEmpty")}</p>}
        <ul className="flex flex-col gap-2">
          {saved.data?.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <span className="flex min-w-0 flex-1 flex-col"><span className="truncate font-medium text-ink">{s.label}</span><span className="truncate text-sm text-muted">{s.fromLabel} - {s.toLabel}</span></span>
              <Button onClick={() => oneTap(s.id)} disabled={requesting.isLoading}>{t("rideNow")}</Button>
              <button type="button" onClick={() => removeSaved(s.id)} aria-label={t("remove")} title={t("remove")} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint text-danger outline-hidden"><CrossIcon size={18} /></button>
            </li>
          ))}
        </ul>
        {formS && (
          <div className="flex flex-col gap-3 rounded-3xl bg-tint p-4">
            <input value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelHint")} aria-label={t("labelHint")} className={tile} />
            <PlaceInput label={t("pickup")} place={from} onPlaceAction={setFrom} locate />
            <PlaceInput label={t("drop")} place={to} onPlaceAction={setTo} />
            <People value={people} onChangeAction={setPeople} />
            <Button onClick={saveSaved} disabled={!place || label.trim().length < 2 || addingSaved.isLoading}>{t("save")}</Button>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{t("weekTitle")}</h2><Button look="quiet" onClick={() => setFormW(!formW)} aria-expanded={formW}>{t("add")}</Button></div>
        <p className="text-sm text-muted">{t("weekHelp")}</p>
        {weekday.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
        {weekday.data && !weekday.data.length && !formW && <p className="text-muted">{t("weekEmpty")}</p>}
        <ul className="flex flex-col gap-2">
          {weekday.data?.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
              <span className="flex flex-col"><span className="truncate font-medium text-ink">{w.fromLabel} - {w.toLabel}</span><span className="text-sm text-muted">{shown(w)}</span>{w.preferredDriverId && <span className="text-sm text-primary">{t("prefers", { name: ridden.data?.find((d) => d.id === w.preferredDriverId)?.name ?? t("yourDriver") })}</span>}</span>
              <span className="grid grid-cols-2 gap-2"><Button look="quiet" onClick={() => today(w.id)} disabled={posting.isLoading}>{t("postToday")}</Button><Button look="danger" onClick={() => cancelWeekday(w.id)}>{t("stop")}</Button></span>
            </li>
          ))}
        </ul>
        {formW && (
          <div className="flex flex-col gap-3 rounded-3xl bg-tint p-4">
            <PlaceInput label={t("pickup")} place={from} onPlaceAction={setFrom} locate />
            <PlaceInput label={t("drop")} place={to} onPlaceAction={setTo} />
            <div role="group" aria-label={t("days")} className="flex flex-wrap gap-2">{order.map((d) => <button key={d} type="button" aria-pressed={days.includes(d)} onClick={() => flip(d)} className={chip(days.includes(d))}>{names[d]}</button>)}</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-2 text-xs text-muted">{t("from")}<input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="bg-transparent text-base text-ink outline-hidden" /></label>
              <label className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-2 text-xs text-muted">{t("until")}<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-transparent text-base text-ink outline-hidden" /></label>
            </div>
            {!windowOk && <p role="alert" className="text-sm text-danger">{t("windowBad")}</p>}
            <People value={people} onChangeAction={setPeople} />
            {Boolean(ridden.data?.length) && (
              <label className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-2 text-xs text-muted">{t("preferDriver")}
                <select value={pref} onChange={(e) => setPref(e.target.value)} className="bg-transparent text-base text-ink outline-hidden"><option value="">{t("noPreference")}</option>{ridden.data?.map((d) => <option key={d.id} value={d.id}>{d.name} · {t("ridesWith", { count: d.rides })}</option>)}</select>
              </label>
            )}
            <Button onClick={saveWeekday} disabled={!place || !days.length || !windowOk || addingWeek.isLoading}>{t("save")}</Button>
          </div>
        )}
      </section>
    </div>
  )
}
