"use client"
import { useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent } from "react"
import { ArrowIcon, CheckIcon, SpinnerIcon } from "@/components/icons"

type Props = { label: string; lockedLabel: string; locked: boolean; onDoneAction: () => void | Promise<void> }

const thumb = 64
const pad = 4

export function Slide({ label, lockedLabel, locked, onDoneAction }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const from = useRef(0)
  const [x, setX] = useState(0)
  const [max, setMax] = useState(1)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const progress = Math.min(x / max, 1)
  const text = locked ? lockedLabel : label
  const finish = async () => {
    setBusy(true)
    try { await onDoneAction() } finally { setBusy(false); setX(0) }
  }
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (locked || busy || !track.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    from.current = e.clientX - x
    setMax(track.current.clientWidth - thumb - pad * 2)
    setDrag(true)
  }
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag) setX(Math.max(0, Math.min(e.clientX - from.current, max)))
  }
  const up = () => {
    if (!drag) return
    setDrag(false)
    if (progress < 0.85) return setX(0)
    setX(max)
    void finish()
  }
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (locked || busy || (e.key !== "Enter" && e.key !== " ")) return
    e.preventDefault()
    void finish()
  }
  return (
    <div ref={track} aria-disabled={locked} className={`relative h-18 select-none overflow-hidden rounded-full p-1 ${locked ? "bg-tint" : "bg-surface"}`}>
      <div className="absolute inset-y-1 left-1 rounded-full bg-primary" style={{ width: x + thumb, transition: drag ? "none" : "width 200ms" }} />
      <span className="absolute inset-0 flex items-center justify-center text-base font-medium text-muted" style={{ opacity: 1 - progress }}>{text}</span>
      <button type="button" disabled={locked} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} aria-label={text} title={text} className={`relative flex size-16 touch-none items-center justify-center rounded-full outline-hidden ${locked ? "bg-muted text-surface" : "bg-primary text-on-primary"}`} style={{ transform: `translateX(${x}px)`, transition: drag ? "none" : "transform 200ms" }}>
        {busy ? <SpinnerIcon size={24} className="animate-spin" /> : progress >= 0.85 ? <CheckIcon size={24} /> : <ArrowIcon size={24} />}
      </button>
    </div>
  )
}
