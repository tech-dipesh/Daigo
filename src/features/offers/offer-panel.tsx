"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useAcceptOfferMutation, useMakeOfferMutation, useOffersQuery } from "@/features/offers/api"
import { useCountdown } from "@/features/rider/use-countdown"

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export function OfferPanel({ matchId, party }: { matchId: string; party: "RIDER" | "DRIVER" }) {
  const t = useTranslations("offers")
  const router = useRouter()
  const info = useOffersQuery(matchId, { pollingInterval: 4000 })
  const [offer, offering] = useMakeOfferMutation()
  const [accept, accepting] = useAcceptOfferMutation()
  const sorted = [...(info.data?.offers ?? [])].sort((a, b) => a.round - b.round)
  const last = sorted[sorted.length - 1]
  const left = useCountdown(last?.expiresAt)
  const bounds = info.data?.bounds
  const [price, setPrice] = useState("")
  const [fail, setFail] = useState("")
  useEffect(() => {
    if (bounds && !price) setPrice(String(last ? last.price : bounds.low))
  }, [bounds?.low, last?.price])
  const theirs = Boolean(last) && last?.by !== party && (left ?? 0) > 0
  const mine = Boolean(last) && last?.by === party && (left ?? 0) > 0
  const value = Number(price)
  const inside = Boolean(bounds) && Number.isFinite(value) && value >= (bounds?.low ?? 0) && value <= (bounds?.high ?? 0)
  const send = async () => {
    setFail("")
    try { await offer({ id: matchId, price: value }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  const take = async () => {
    setFail("")
    try {
      const done = await accept(matchId).unwrap()
      router.replace(`${party === "DRIVER" ? "/driver/trips" : "/trips"}/${done.tripId}`)
    } catch (err) { setFail(errText(err)) }
  }
  if (!info.data) return null
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-tint p-3">
      <p className="text-sm text-ink">{t("fast")}</p>
      {sorted.length > 0 && <ul className="flex flex-col gap-1 text-sm text-ink">{sorted.map((o) => <li key={o.id} className="flex justify-between"><span>{o.by === party ? t("you") : t("them")}</span><span>₹{o.price}</span></li>)}</ul>}
      {theirs && last && <Button onClick={take} disabled={accepting.isLoading}>{t("acceptAt", { price: last.price })} ({mmss(left ?? 0)})</Button>}
      {mine && <p className="text-sm text-muted">{t("waitOther", { time: mmss(left ?? 0) })}</p>}
      {info.data.nextRound !== null && !mine && bounds && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">{t("between", { low: bounds.low, high: bounds.high })}</p>
          <div className="flex gap-2"><input type="number" inputMode="numeric" value={price} min={bounds.low} max={bounds.high} onChange={(e) => setPrice(e.target.value)} aria-label={t("yourPrice")} className="h-12 min-w-0 flex-1 rounded-2xl bg-surface px-4 text-base text-ink outline-hidden" /><Button look="quiet" onClick={send} disabled={!inside || offering.isLoading}>{t("offer")}</Button></div>
        </div>
      )}
      {info.data.nextRound === null && !theirs && !mine && <p className="text-sm text-muted">{t("noMore")}</p>}
      <p role="alert" className="min-h-4 text-sm text-danger">{fail}</p>
    </div>
  )
}
