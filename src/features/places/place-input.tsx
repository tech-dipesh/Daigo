"use client"
import { useEffect, useId, useState } from "react"
import type { KeyboardEvent } from "react"
import axios from "axios"
import { useTranslations } from "next-intl"
import { LocateIcon, PinIcon, SpinnerIcon } from "@/components/icons"
import { searchPlaces } from "@/features/places/search"
import type { Place } from "@/features/places/search"

type Props = { label: string; place: Place | null; onPlace: (p: Place | null) => void; locate?: boolean }

export function PlaceInput({ label, place, onPlace, locate }: Props) {
  const t = useTranslations("rider")
  const list = useId()
  const [text, setText] = useState(place?.label ?? "")
  const [found, setFound] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (text.trim().length < 3 || text === place?.label) return setFound([])
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setBusy(true)
      try {
        setFound(await searchPlaces(text.trim(), controller.signal))
        setActive(0)
      } catch (err) {
        if (!axios.isCancel(err)) setFound([])
      } finally { setBusy(false) }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [text, place?.label])
  const type = (v: string) => {
    setText(v)
    setOpen(true)
    if (place) onPlace(null)
  }
  const choose = (p: Place) => {
    setText(p.label)
    setOpen(false)
    onPlace(p)
  }
  const here = () => navigator.geolocation.getCurrentPosition((pos) => choose({ label: t("myLocation"), lat: pos.coords.latitude, lng: pos.coords.longitude }))
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") setActive(Math.min(active + 1, found.length - 1))
    if (e.key === "ArrowUp") setActive(Math.max(active - 1, 0))
    if (e.key === "Enter" && open && found[active]) {
      e.preventDefault()
      choose(found[active])
    }
    if (e.key === "Escape") setOpen(false)
  }
  return (
    <div className="relative">
      <label className="flex h-16 items-center gap-3 rounded-2xl bg-surface px-4 transition-colors focus-within:bg-tint">
        <PinIcon size={20} className={place ? "text-success" : "text-muted"} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted">{label}</span>
          <input role="combobox" aria-expanded={open && found.length > 0} aria-controls={list} aria-autocomplete="list" value={text} onChange={(e) => type(e.target.value)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={key} placeholder={t("searchHint")} autoComplete="off" className="w-full bg-transparent text-base text-ink outline-hidden placeholder:text-muted" />
        </span>
        {busy && <SpinnerIcon size={18} className="animate-spin text-muted" />}
        {locate && <button type="button" onClick={here} aria-label={t("useLocation")} title={t("useLocation")} className="text-primary outline-hidden"><LocateIcon size={22} /></button>}
      </label>
      {open && text.trim().length >= 3 && !busy && (
        <ul id={list} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 flex max-h-64 flex-col overflow-auto rounded-2xl bg-surface p-1 shadow-xs">
          {found.length ? found.map((p, i) => <li key={`${p.lat}${p.lng}${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); choose(p) }} className={`rounded-xl px-3 py-2 text-base text-ink ${i === active ? "bg-tint" : ""}`}>{p.label}</li>) : <li className="px-3 py-2 text-sm text-muted">{t("noPlaces")}</li>}
        </ul>
      )}
    </div>
  )
}
