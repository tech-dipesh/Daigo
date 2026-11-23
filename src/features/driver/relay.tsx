"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SendIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { clock } from "@/lib/time"
import { LazyMap } from "@/features/map/map-lazy"
import { useMeQuery } from "@/features/me/api"
import { useDecideRelayMutation, useRelayMessagesQuery, useRelayQuery, useSendRelayMessageMutation } from "@/features/driver/api"
import { useCountdown } from "@/features/rider/use-countdown"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"

export function RelayOfferView({ id }: { id: string }) {
  const t = useTranslations("relay")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const me = useMeQuery()
  const relay = useRelayQuery(id, { pollingInterval: 5000 })
  const msgs = useRelayMessagesQuery(id, { pollingInterval: 4000 })
  const [decide, deciding] = useDecideRelayMutation()
  const [send, sending] = useSendRelayMessageMutation()
  const [text, setText] = useState("")
  const [fail, setFail] = useState("")
  const end = useRef<HTMLDivElement>(null)
  const r = relay.data
  const left = useCountdown(r?.expiresAt)
  const open = r?.status === "PENDING" && r.myStatus === "PENDING" && left !== 0
  const go = async (status: "ACCEPTED" | "REJECTED") => {
    setFail("")
    try {
      await decide({ id, status }).unwrap()
      dispatch(pushToast({ key: status === "ACCEPTED" ? "relay.accepted" : "relay.rejected", kind: "success" }))
      if (status === "REJECTED") router.replace("/driver")
    } catch (err) { setFail(errText(err)) }
  }
  const talk = async () => {
    const body = text.trim()
    if (!body) return
    try {
      await send({ id, text: body }).unwrap()
      setText("")
      end.current?.scrollIntoView({ block: "end" })
    } catch (err) { setFail(errText(err)) }
  }
  if (relay.isLoading) return <SpinnerIcon size={28} className="mt-10 animate-spin text-muted" />
  if (!r) return <p role="alert" className="mt-10 text-danger">{t("loadFail")}</p>
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between"><h1 className="text-title font-semibold">{t(r.leg === "FIRST" ? "titleFirst" : "titleSecond")}</h1><Link href="/driver" className="text-sm text-primary">{t("back")}</Link></div>
      <div className="h-56"><LazyMap from={r.transfer} to={null} driver={null} label={t("mapLabel")} /></div>
      <div className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
        <p className="text-xs text-muted">{t("rider")}</p>
        <p className="text-ink">{r.from} - {r.to}</p>
        <p className="mt-2 text-xs text-muted">{t("yourRoute")}</p>
        <p className="text-ink">{r.route.from} - {r.route.to} · {clock(r.route.departureTime)}</p>
        <p className="mt-2 text-sm text-muted">{t(r.leg === "FIRST" ? "handoverFirst" : "handoverSecond")} · {t("people", { count: r.groupSize })} · ₹{r.price}</p>
      </div>
      <p className="rounded-2xl bg-tint px-4 py-3 text-ink" aria-live="polite">{r.otherAccepted ? t("otherYes") : t("otherWaiting")}</p>
      {open && <div className="grid grid-cols-2 gap-2"><Button look="danger" onClick={() => go("REJECTED")} disabled={deciding.isLoading}>{t("reject")}</Button><button type="button" onClick={() => go("ACCEPTED")} disabled={deciding.isLoading} className="h-12 rounded-2xl bg-success px-5 text-base font-medium text-on-primary outline-hidden disabled:opacity-50">{t("accept")}{left ? ` (${left}s)` : ""}</button></div>}
      {r.myStatus === "ACCEPTED" && r.status === "PENDING" && <p className="text-sm text-muted">{t("youAccepted")}</p>}
      {r.status === "CONFIRMED" && <Link href="/driver/trips" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("openTrips")}</Link>}
      {r.status === "REJECTED" && <p className="text-muted">{t("closed")}</p>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <section className="flex flex-col gap-2" aria-label={t("chat")}>
        <h2 className="text-lg font-semibold">{t("chat")}</h2>
        <p className="text-sm text-muted">{t("chatHelp")}</p>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto" aria-live="polite">
          {msgs.data && !msgs.data.length && <p className="text-muted">{t("chatEmpty")}</p>}
          {msgs.data?.map((m) => <div key={m.id} className={`flex max-w-[80%] flex-col rounded-2xl px-4 py-2 ${m.senderId === me.data?.id ? "self-end bg-primary text-on-primary" : "self-start bg-surface text-ink"}`}><span className="whitespace-pre-wrap">{m.text}</span><span className="self-end text-xs opacity-70">{clock(m.at)}</span></div>)}
          <div ref={end} />
        </div>
        {r.status !== "REJECTED" && (
          <div className="flex items-end gap-2">
            <textarea value={text} maxLength={500} rows={2} onChange={(e) => setText(e.target.value)} placeholder={t("chatHint")} aria-label={t("chatHint")} className="min-h-14 flex-1 rounded-2xl bg-surface p-3 text-base text-ink outline-hidden" />
            <button type="button" onClick={talk} disabled={sending.isLoading || !text.trim()} aria-label="Send" title="Send" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary outline-hidden disabled:opacity-50"><SendIcon size={22} /></button>
          </div>
        )}
      </section>
    </div>
  )
}
