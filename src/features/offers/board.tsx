"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SpinnerIcon, StarIcon, UserIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { trustWord } from "@/lib/trust"
import { useBoardQuery } from "@/features/offers/api"
import { OfferPanel } from "@/features/offers/offer-panel"
import { useListTripsQuery } from "@/features/rider/api"

type Sort = "best" | "cheap" | "near"

export function Board({ id }: { id: string }) {
  const t = useTranslations("offers")
  const tt = useTranslations("trips")
  const router = useRouter()
  const board = useBoardQuery(id, { pollingInterval: 5000 })
  const [sort, setSort] = useState<Sort>("best")
  const [open, setOpen] = useState("")
  const matched = board.data?.status === "MATCHED"
  const trips = useListTripsQuery(undefined, { skip: !matched })
  const tripId = trips.data?.find((x) => x.rideRequestId === id)?.id
  useEffect(() => {
    if (tripId) router.replace(`/trips/${tripId}`)
  }, [tripId, router])
  const items = [...(board.data?.items ?? [])].sort((a, b) => (sort === "cheap" ? a.price - b.price : sort === "near" ? a.detourKm - b.detourKm : b.driver.trustScore - a.driver.trustScore || a.price - b.price))
  const chip = (on: boolean) => `h-11 rounded-2xl px-4 text-sm outline-hidden ${on ? "bg-primary text-on-primary" : "bg-surface text-ink"}`
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-title font-semibold">{t("title")}</h1><Link href={`/request/${id}/waiting`} className="text-sm text-primary">{t("backWaiting")}</Link></div>
      <div role="radiogroup" aria-label={t("sort")} className="flex gap-2">
        {([["best", "best"], ["cheap", "cheapest"], ["near", "nearest"]] as const).map(([k, label]) => <button key={k} type="button" role="radio" aria-checked={sort === k} onClick={() => setSort(k)} className={chip(sort === k)}>{t(label)}</button>)}
      </div>
      {board.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {board.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {board.data && !items.length && <p className="text-muted">{matched ? t("matched") : t("empty")}</p>}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((x) => (
          <li key={x.matchId} className="flex flex-col gap-3 rounded-3xl bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-tint text-muted"><UserIcon size={24} /></span>
              <span className="flex min-w-0 flex-col"><span className="truncate text-lg font-medium text-ink">{x.driver.name ?? t("driver")}</span><span className="flex items-center gap-1 text-sm text-muted">{tt(`trust_${trustWord(x.driver.trustScore)}`)}{x.driver.ratingAvg !== null && <><StarIcon size={14} className="fill-current" />{x.driver.ratingAvg.toFixed(1)} ({x.driver.ratingCount})</>}</span></span>
            </div>
            <p className="text-sm text-muted">{x.vehicle.make} {x.vehicle.model} · {t("detour", { km: x.detourKm.toFixed(1) })}</p>
            <p className="text-title leading-none font-semibold text-primary">₹{x.lastOffer ? x.lastOffer.price : x.price}</p>
            <Button look="quiet" onClick={() => setOpen(open === x.matchId ? "" : x.matchId)} aria-expanded={open === x.matchId}>{t("negotiate")}</Button>
            {open === x.matchId && <OfferPanel matchId={x.matchId} party="RIDER" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
