"use client"
import { useRef } from "react"
import type { ClipboardEvent, KeyboardEvent } from "react"

const size = 6

export function CodeBoxes({ value, onChangeAction, label }: { value: string; onChangeAction: (v: string) => void; label: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const done = value.length === size
  const tone = done ? "text-success" : "text-danger"
  const focus = (i: number) => refs.current[Math.max(0, Math.min(i, size - 1))]?.focus()
  const type = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return
    const next = (value.slice(0, i) + digits).slice(0, size)
    onChangeAction(next)
    focus(next.length)
  }
  const back = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return
    e.preventDefault()
    onChangeAction(value.length > i ? value.slice(0, i) + value.slice(i + 1) : value.slice(0, -1))
    focus(value.length > i ? i : i - 1)
  }
  const paste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const next = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, size)
    onChangeAction(next)
    focus(next.length)
  }
  return (
    <div role="group" aria-label={label} className="grid grid-cols-6 gap-2">
      {Array.from({ length: size }, (_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }} value={value[i] ?? ""} onChange={(e) => type(i, e.target.value)} onKeyDown={(e) => back(i, e)} onPaste={paste} onFocus={(e) => e.target.select()} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`${label} ${i + 1}`} className={`h-21 w-full min-w-0 rounded-2xl bg-surface text-center text-title font-semibold outline-hidden transition-colors focus-visible:bg-tint ${tone}`} />
      ))}
    </div>
  )
}
