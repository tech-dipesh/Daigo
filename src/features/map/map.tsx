"use client"
import { useEffect, useRef, useState } from "react"
import type { Map as GL, Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { STADIA } from "@/lib/env"

type Pt = { lat: number; lng: number }
type Lib = typeof import("maplibre-gl")

const home: [number, number] = [76.7794, 30.7333]
const isDark = () => document.documentElement.dataset.theme === "dark"
const style = (dark: boolean) => `https://tiles.stadiamaps.com/styles/${dark ? "alidade_smooth_dark" : "alidade_smooth"}.json${STADIA ? `?api_key=${STADIA}` : ""}`
const pin = (cls: string) => Object.assign(document.createElement("div"), { className: `size-4 rounded-full shadow-xs ${cls}` })

export function RouteMap({ from, to, driver, label }: { from?: Pt | null; to?: Pt | null; driver?: Pt | null; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<GL | null>(null)
  const pins = useRef<Marker[]>([])
  const lib = useRef<Lib | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let gone = false
    let watcher: MutationObserver | null = null
    const start = async () => {
      const ml = await import("maplibre-gl")
      if (gone || !box.current) return
      lib.current = ml
      const gl = new ml.Map({ container: box.current, style: style(isDark()), center: home, zoom: 11, attributionControl: { compact: true } })
      map.current = gl
      watcher = new MutationObserver(() => gl.setStyle(style(isDark())))
      watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
      setReady(true)
    }
    void start()
    return () => {
      gone = true
      watcher?.disconnect()
      map.current?.remove()
      map.current = null
    }
  }, [])
  useEffect(() => {
    const gl = map.current
    const ml = lib.current
    if (!ready || !gl || !ml) return
    pins.current.forEach((m) => m.remove())
    pins.current = []
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const add = (p: Pt, cls: string) => pins.current.push(new ml.Marker({ element: pin(cls) }).setLngLat([p.lng, p.lat]).addTo(gl))
    if (from) add(from, "bg-primary")
    if (to) add(to, "bg-danger")
    if (driver) add(driver, "bg-success")
    const all = [from, to, driver].filter((p): p is Pt => Boolean(p))
    if (all.length > 1) gl.fitBounds([[Math.min(...all.map((p) => p.lng)), Math.min(...all.map((p) => p.lat))], [Math.max(...all.map((p) => p.lng)), Math.max(...all.map((p) => p.lat))]], { padding: 70, maxZoom: 15, animate: !calm })
    else if (all[0]) gl.easeTo({ center: [all[0].lng, all[0].lat], zoom: 14, animate: !calm })
  }, [ready, from?.lat, from?.lng, to?.lat, to?.lng, driver?.lat, driver?.lng])
  return <div ref={box} role="img" aria-label={label} className="size-full min-h-64 overflow-hidden rounded-3xl bg-tint" />
}
