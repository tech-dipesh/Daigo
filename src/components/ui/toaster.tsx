"use client"
import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { dropToast } from "@/store/ui"
import type { Toast } from "@/store/ui"
import { useAppDispatch, useAppSelector } from "@/store"

function Item({ id, text, kind }: { id: string; text: string; kind: Toast["kind"] }) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const t = setTimeout(() => dispatch(dropToast(id)), 4000)
    return () => clearTimeout(t)
  }, [id, dispatch])
  const tone = kind === "error" ? "text-danger" : kind === "success" ? "text-success" : "text-ink"
  return <p className={`pointer-events-auto rounded-2xl bg-surface px-4 py-3 text-sm shadow-xs ${tone}`}>{text}</p>
}

export function Toaster() {
  const t = useTranslations()
  const toasts = useAppSelector((s) => s.ui.toasts)
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4">
      {toasts.map((x) => <Item key={x.id} id={x.id} text={t(x.key)} kind={x.kind} />)}
    </div>
  )
}
