"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { CrossIcon, SpinnerIcon } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { Toggle } from "@/components/ui/toggle"
import { errText, isApiError } from "@/lib/errors"
import { emailOk } from "@/features/auth/rules"
import { useCoinsQuery, useGetPaymentQuery, useGetTripQuery, usePayMutation } from "@/features/trips/api"

export function Pay({ id }: { id: string }) {
  const t = useTranslations("trips")
  const trip = useGetTripQuery(id)
  const paid = useGetPaymentQuery(id, { pollingInterval: 5000 })
  const coins = useCoinsQuery()
  const [pay] = usePayMutation()
  const [method, setMethod] = useState<"ONLINE" | "CASH">("ONLINE")
  const [redeem, setRedeem] = useState(false)
  const [friends, setFriends] = useState<string[]>([])
  const [mail, setMail] = useState("")
  const [fail, setFail] = useState("")
  const none = isApiError(paid.error) && paid.error.status === 404
  const discount = redeem && coins.data?.eligibleForDiscount ? coins.data.discountRupees : 0
  const total = Math.max(0, (trip.data?.priceEstimate ?? 0) - discount)
  const go = async () => {
    setFail("")
    try { await pay({ id, method, redeemCoins: redeem, splitWith: friends }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  const add = () => {
    if (!emailOk(mail) || friends.includes(mail) || friends.length >= 4) return
    setFriends([...friends, mail])
    setMail("")
  }
  if (trip.isLoading || paid.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (paid.data) {
    const p = paid.data
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-title font-semibold">{p.status === "PAID" ? t("paidTitle") : t("pendingTitle")}</h1>
        <p className="text-fare leading-none font-semibold text-primary">₹{p.amount}</p>
        <p className="text-muted">{p.status === "PAID" ? t("paidSub") : p.method === "CASH" ? t("cashSub") : t("sharesSub")}</p>
        {p.shares.length > 0 && <ul className="flex flex-col gap-2">{p.shares.map((s) => <li key={s.id} className="flex justify-between rounded-2xl bg-surface px-4 py-3"><span>{s.amount ? `₹${s.amount}` : t("share")}</span><span className={s.overdue ? "text-danger" : "text-muted"}>{s.overdue ? t("overdue") : s.status}</span></li>)}</ul>}
        <Link href={`/trips/${id}/rate`} className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("rate")}</Link>
      </div>
    )
  }
  if (!none) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold">{t("payTitle")}</h1>
      <p className="text-fare leading-none font-semibold text-primary">₹{total}</p>
      <div role="radiogroup" aria-label={t("method")} className="grid grid-cols-2 gap-1 rounded-2xl bg-tint p-1">
        {(["ONLINE", "CASH"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={`h-11 rounded-xl text-base font-medium outline-hidden ${method === m ? "bg-primary text-on-primary" : "text-ink"}`}>{t(m === "ONLINE" ? "online" : "cash")}</button>)}
      </div>
      {coins.data?.eligibleForDiscount && <Toggle label={t("useCoins")} hint={t("coinsHint", { coins: coins.data.coinBalance, rupees: coins.data.discountRupees })} on={redeem} onChangeAction={setRedeem} />}
      {coins.data && !coins.data.eligibleForDiscount && <p className="text-sm text-muted">{t("coinsNeed", { coins: coins.data.coinsNeeded })}</p>}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{t("splitHelp")}</p>
        <div className="flex items-start gap-2"><div className="flex-1"><Input label={t("friendMail")} type="email" value={mail} onChange={(e) => setMail(e.target.value)} error={emailOk(mail) ? undefined : t("mailBad")} /></div><button type="button" onClick={add} disabled={!emailOk(mail) || friends.length >= 4} className="h-16 rounded-2xl bg-tint px-4 text-ink outline-hidden disabled:opacity-50">{t("add")}</button></div>
        <ul className="flex flex-wrap gap-2">{friends.map((f) => <li key={f} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm text-ink">{f}<button type="button" onClick={() => setFriends(friends.filter((x) => x !== f))} aria-label={t("remove")} title={t("remove")} className="text-muted outline-hidden"><CrossIcon size={14} /></button></li>)}</ul>
      </div>
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slidePay")} lockedLabel={t("lockedPay")} locked={trip.data?.status !== "COMPLETED"} onDoneAction={go} />
    </div>
  )
}
