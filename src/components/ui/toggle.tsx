"use client"

export function Toggle({ label, on, onChangeAction, hint }: { label: string; on: boolean; onChangeAction: (v: boolean) => void; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChangeAction(!on)} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-left outline-hidden">
      <span className="flex flex-col"><span className="text-base text-ink">{label}</span>{hint && <span className="text-sm text-muted">{hint}</span>}</span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${on ? "bg-primary" : "bg-tint"}`}><span className={`size-5 rounded-full bg-surface transition-transform ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  )
}
