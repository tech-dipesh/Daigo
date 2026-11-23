"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { CrossIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { stamp } from "@/lib/time"
import { useListRequestsQuery, useRetryRequestMutation } from "@/features/rider/api"
import { useLeaveWaitlistMutation, useWaitlistQuery } from "@/features/waitlist/api"

type Tab = "WAITING" | "NOTIFIED"

const tab = (on: boolean) => `h-11 flex-1 rounded-xl text-base font-medium outline-hidden ${on ? "bg-primary text-on-primary" : "text-ink"}`

export function WaitlistView() {
  const t = useTranslations("waitlist")
  const router = useRouter()
  const list = useWaitlistQuery()
  const reqs = useListRequestsQuery()
  const [leave, leaving] = useLeaveWaitlistMutation()
  const [retry, retrying] = useRetryRequestMutation()
  const [shown, setShown] = useState<Tab>("WAITING")
  const [fail, setFail] = useState("")
  const rows = list.data?.filter((e) => e.status === shown)
  const matched = list.data?.filter((e) => e.status === "NOTIFIED").length ?? 0
  const again = async (id: string) => {
    setFail("")
    try {
      const made = await retry(id).unwrap()
      router.push(`/request/${made.id}/waiting`)
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("sub")}</p>
      <div role="tablist" aria-label={t("title")} className="flex gap-1 rounded-2xl bg-tint p-1">
        <button type="button" role="tab" aria-selected={shown === "WAITING"} onClick={() => setShown("WAITING")} className={tab(shown === "WAITING")}>{t("tabWaiting")}</button>
        <button type="button" role="tab" aria-selected={shown === "NOTIFIED"} onClick={() => setShown("NOTIFIED")} className={tab(shown === "NOTIFIED")}>{t("tabMatched")}{matched > 0 ? ` (${matched})` : ""}</button>
      </div>
      {list.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {list.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {rows && !rows.length && <p className="text-muted">{t(shown === "WAITING" ? "empty" : "emptyMatched")}</p>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <ul className="flex flex-col gap-2">
        {rows?.map((e) => {
          const r = reqs.data?.find((x) => x.id === e.requestId)
          return (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{r ? `${r.fromLabel} - ${r.toLabel}` : t("ride")}</span><span className="text-sm text-muted">{shown === "NOTIFIED" && e.notifiedAt ? t("matchedAt", { time: stamp(e.notifiedAt) }) : e.expiresAt ? t("until", { time: stamp(e.expiresAt) }) : t("waiting")}</span></span>
              {shown === "WAITING" ? <button type="button" onClick={() => leave(e.requestId)} disabled={leaving.isLoading} aria-label={t("remove")} title={t("remove")} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-danger outline-hidden"><CrossIcon size={18} /></button> : <Button onClick={() => again(e.requestId)} disabled={retrying.isLoading}>{t("searchAgain")}</Button>}
            </li>
          )
        })}
      </ul>
      <Link href="/request/new" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("newRide")}</Link>
    </div>
  )
}
