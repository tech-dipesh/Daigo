"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { CrossIcon, SpinnerIcon } from "@/components/icons"
import { stamp } from "@/lib/time"
import { useListRequestsQuery } from "@/features/rider/api"
import { useLeaveWaitlistMutation, useWaitlistQuery } from "@/features/waitlist/api"

export function WaitlistView() {
  const t = useTranslations("waitlist")
  const list = useWaitlistQuery()
  const reqs = useListRequestsQuery()
  const [leave, leaving] = useLeaveWaitlistMutation()
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("sub")}</p>
      {list.isLoading && <SpinnerIcon size={24} className="animate-spin text-muted" />}
      {list.isError && <p role="alert" className="text-danger">{t("loadFail")}</p>}
      {list.data && !list.data.length && <p className="text-muted">{t("empty")}</p>}
      <ul className="flex flex-col gap-2">
        {list.data?.map((e) => {
          const r = reqs.data?.find((x) => x.id === e.requestId)
          return (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="flex min-w-0 flex-col"><span className="truncate text-ink">{r ? `${r.fromLabel} - ${r.toLabel}` : t("ride")}</span><span className="text-sm text-muted">{e.expiresAt ? t("until", { time: stamp(e.expiresAt) }) : t("waiting")}</span></span>
              <button type="button" onClick={() => leave(e.requestId)} disabled={leaving.isLoading} aria-label={t("remove")} title={t("remove")} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-danger outline-hidden"><CrossIcon size={18} /></button>
            </li>
          )
        })}
      </ul>
      <Link href="/request/new" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("newRide")}</Link>
    </div>
  )
}
