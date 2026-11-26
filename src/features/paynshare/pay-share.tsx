"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SpinnerIcon } from "@/components/icons"
import { Slide } from "@/components/ui/slide"
import { errText, isApiError } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useCheckout } from "@/features/payments/use-checkout"
import { usePayShareMutation, useShareQuery } from "@/features/shared/api"

export function PayShare({ id }: { id: string }) {
  const t = useTranslations("payShare")
  const q = useShareQuery(id)
  const [pay] = usePayShareMutation()
  const checkout = useCheckout()
  const [fail, setFail] = useState("")
  const d = q.data
  const go = async () => {
    setFail("")
    try {
      const res = await pay(id).unwrap()
      if (!res.checkout) return
      const outcome = await checkout.run(res.checkout)
      setFail(outcome === "cancelled" ? t("payCancelled") : outcome === "waiting" ? t("payWaiting") : "")
    } catch (err) { setFail(errText(err)) }
  }
  if (q.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!d) return <div className="flex flex-col gap-2"><h1 className="text-title font-semibold">{t("title")}</h1><p role="alert" className="text-danger">{isApiError(q.error) ? q.error.message : t("loadFail")}</p><p className="text-muted">{t("wrongAccount")}</p></div>
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{d.status === "PAID" ? t("paidTitle") : t("title")}</h1>
      <p className="text-fare leading-none font-semibold text-primary">₹{d.amount}</p>
      {d.status === "PENDING" && <p className="text-muted">{t("before", { time: stamp(d.expiresAt) })}</p>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      {d.status === "PENDING" ? <Slide label={t("slide")} lockedLabel={t("slide")} locked={false} onDoneAction={go} /> : <Link href="/" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("home")}</Link>}
    </div>
  )
}
