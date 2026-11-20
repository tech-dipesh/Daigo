"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { stamp } from "@/lib/time"
import { useNotesQuery, useReadAllMutation, useReadNoteMutation } from "@/features/alerts/api"
import type { Note } from "@/features/alerts/api"
import { useMeQuery } from "@/features/me/api"
import { useCoinsQuery } from "@/features/trips/api"

const step = 20

export function Alerts() {
  const t = useTranslations("alerts")
  const router = useRouter()
  const [limit, setLimit] = useState(step)
  const notes = useNotesQuery(limit)
  const coins = useCoinsQuery()
  const me = useMeQuery()
  const [read] = useReadNoteMutation()
  const [readAll, clearing] = useReadAllMutation()
  const open = async (n: Note) => {
    if (!n.readAt) await read(n.id)
    const trip = n.data?.tripId
    if (typeof trip === "string") router.push(`${me.data?.activeRole === "DRIVER" ? "/driver/trips" : "/trips"}/${trip}`)
  }
  const page = notes.data
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {coins.data && (
        <section className="flex flex-col gap-1 rounded-3xl bg-primary p-6 text-on-primary">
          <p className="text-sm">{t("coins")}</p>
          <p className="text-fare leading-none font-semibold">{coins.data.coinBalance}</p>
          <p className="text-sm">{coins.data.eligibleForDiscount ? t("coinsReady", { rupees: coins.data.discountRupees }) : t("coinsNeed", { coins: coins.data.coinsNeeded })}</p>
        </section>
      )}
      <div className="flex items-center justify-between gap-3"><h1 className="text-title font-semibold">{t("title")}{page && page.unreadCount > 0 ? ` (${page.unreadCount})` : ""}</h1>{page && page.unreadCount > 0 && <Button look="quiet" onClick={() => readAll()} disabled={clearing.isLoading}>{t("readAll")}</Button>}</div>
      {notes.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {notes.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {page && !page.items.length && <p className="text-muted">{t("empty")}</p>}
      <ul className="flex flex-col gap-2">
        {page?.items.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => open(n)} className="flex w-full items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-left outline-hidden">
              <span className={`mt-2 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-primary"}`} aria-label={n.readAt ? undefined : t("unread")} />
              <span className="flex min-w-0 flex-col"><span className={`text-ink ${n.readAt ? "" : "font-semibold"}`}>{n.title}</span><span className="text-sm text-muted">{n.body}</span><span className="text-xs text-muted">{stamp(n.createdAt)}</span></span>
            </button>
          </li>
        ))}
      </ul>
      {page?.nextCursor && limit < 50 && <Button look="quiet" onClick={() => setLimit(Math.min(50, limit + step))}>{t("more")}</Button>}
    </div>
  )
}
