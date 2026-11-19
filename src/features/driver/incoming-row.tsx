"use client"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useCountdown } from "@/features/rider/use-countdown"
import { useDecideMatchMutation } from "@/features/driver/api"
import type { Incoming } from "@/features/driver/api"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"

export function IncomingRow({ item }: { item: Incoming }) {
  const t = useTranslations("driver")
  const dispatch = useAppDispatch()
  const [decide, state] = useDecideMatchMutation()
  const left = useCountdown(item.expiresAt)
  const go = async (status: "ACCEPTED" | "REJECTED") => {
    try {
      await decide({ id: item.id, status }).unwrap()
      if (status === "ACCEPTED") dispatch(pushToast({ key: "driver.accepted", kind: "success" }))
    } catch (err) { dispatch(pushToast({ key: errText(err) ? "driver.taken" : "errors.unknown", kind: "error" })) }
  }
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{item.from} - {item.to}</span><span className="text-sm text-muted">{t("people", { count: item.groupSize })} · {t("detour", { km: item.detourKm.toFixed(1) })}{item.isVulnerable ? ` · ${t("care")}` : ""}</span></span>
        <span className="flex flex-col items-end"><span className="text-title leading-none font-semibold text-ink">₹{item.price}</span><span className="text-sm text-muted">{left ?? 0}s</span></span>
      </div>
      <div className="grid grid-cols-2 gap-2"><Button look="danger" onClick={() => go("REJECTED")} disabled={state.isLoading}>{t("reject")}</Button><button type="button" onClick={() => go("ACCEPTED")} disabled={state.isLoading} className="h-12 rounded-2xl bg-success px-5 text-base font-medium text-on-primary outline-hidden disabled:opacity-50">{t("accept")}</button></div>
    </li>
  )
}
