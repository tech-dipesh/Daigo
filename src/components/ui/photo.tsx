"use client"
import type { ChangeEvent } from "react"
import { CameraIcon, CheckIcon } from "@/components/icons"

const types = ["image/jpeg", "image/png", "image/webp"]
const max = 5 * 1024 * 1024

export const photoIssue = (f: File | null) => (!f ? "photoNeed" : !types.includes(f.type) ? "photoType" : f.size > max ? "photoBig" : null)

type Props = { label: string; hint: string; file: File | null; onFile: (f: File | null) => void; error?: string }

export function PhotoField({ label, hint, file, onFile, error }: Props) {
  const pick = (e: ChangeEvent<HTMLInputElement>) => onFile(e.target.files?.[0] ?? null)
  const tone = error ? "text-danger" : file ? "text-success" : "text-muted"
  return (
    <div>
      <label className="flex h-16 items-center gap-3 rounded-2xl bg-surface px-4 transition-colors focus-within:bg-tint">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={`text-xs ${tone}`}>{label}</span>
          <span className="truncate text-base text-ink">{file ? file.name : hint}</span>
        </span>
        {file && !error ? <CheckIcon size={20} className="text-success" /> : <CameraIcon size={20} className="text-muted" />}
        <input type="file" accept={types.join(",")} onChange={pick} className="sr-only" />
      </label>
      <p role={error ? "alert" : undefined} className="min-h-5 px-1 pt-1 text-sm text-danger">{error ?? ""}</p>
    </div>
  )
}
