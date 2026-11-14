"use client"
import { useId, useState } from "react"
import type { InputHTMLAttributes } from "react"
import { CheckIcon, CrossIcon, EyeIcon, EyeOffIcon } from "@/components/icons"

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value"> & { label: string; value: string; error?: string }

export function Input({ label, value, error, type = "text", ...rest }: Props) {
  const [show, setShow] = useState(false)
  const msg = useId()
  const state = !value ? "idle" : error ? "bad" : "ok"
  const tone = state === "bad" ? "text-danger" : state === "ok" ? "text-success" : "text-muted"
  const kind = type === "password" && show ? "text" : type
  const eye = show ? "Hide password" : "Show password"
  return (
    <div>
      <label className="flex h-16 items-center gap-3 rounded-2xl bg-surface px-4 transition-colors focus-within:bg-tint">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={`text-xs ${tone}`}>{label}</span>
          <input type={kind} value={value} aria-invalid={state === "bad"} aria-describedby={msg} className="w-full bg-transparent text-base text-ink outline-hidden placeholder:text-muted" {...rest} />
        </span>
        {type === "password" && <button type="button" onClick={() => setShow(!show)} aria-label={eye} title={eye} className="text-muted outline-hidden">{show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}</button>}
        {state === "bad" && <CrossIcon size={20} className="text-danger" />}
        {state === "ok" && <CheckIcon size={20} className="text-success" />}
      </label>
      <p id={msg} role={state === "bad" ? "alert" : undefined} className="min-h-5 px-1 pt-1 text-sm text-danger">{state === "bad" ? error : ""}</p>
    </div>
  )
}
