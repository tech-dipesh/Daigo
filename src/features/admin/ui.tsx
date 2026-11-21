"use client"
import type { ReactNode } from "react"
import { SpinnerIcon } from "@/components/icons"

export function Tabs<T extends string>({ value, options, onChangeAction, label }: { value: T; options: { id: T; label: string }[]; onChangeAction: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
      {options.map((o) => <button key={o.id} type="button" role="tab" aria-selected={value === o.id} onClick={() => onChangeAction(o.id)} className={`h-9 rounded-xl px-3 text-sm outline-hidden ${value === o.id ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{o.label}</button>)}
    </div>
  )
}

export function State({ loading, error, empty, emptyText, errorText }: { loading: boolean; error: boolean; empty: boolean; emptyText: string; errorText: string }) {
  if (loading) return <SpinnerIcon size={20} className="animate-spin text-muted" />
  if (error) return <p role="alert" className="text-danger">{errorText}</p>
  return empty ? <p className="text-muted">{emptyText}</p> : null
}

export function Title({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-3"><h1 className="text-xl font-semibold">{children}</h1>{aside}</div>
}

export const cell = "px-3 py-2 text-left align-top"
export const field = "h-9 rounded-xl bg-surface px-3 text-sm text-ink outline-hidden placeholder:text-muted"
