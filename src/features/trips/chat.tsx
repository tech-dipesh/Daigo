"use client"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { SendIcon, SpinnerIcon } from "@/components/icons"
import { errText } from "@/lib/errors"
import { clock } from "@/lib/time"
import { useMeQuery } from "@/features/me/api"
import { useGetTripQuery, useMessagesQuery, useSendMessageMutation } from "@/features/trips/api"


export function TripChat({ id }: { id: string }) {
  const t = useTranslations("trips")
  const me = useMeQuery()
  const trip = useGetTripQuery(id)
  const msgs = useMessagesQuery(id, { pollingInterval: 3000 })
  const [send, sending] = useSendMessageMutation()
  const [text, setText] = useState("")
  const [fail, setFail] = useState("")
  const end = useRef<HTMLDivElement>(null)
  const open = trip.data?.status === "PENDING_PICKUP" || trip.data?.status === "IN_PROGRESS"
  const count = msgs.data?.length ?? 0
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [count])
  const go = async () => {
    const body = text.trim()
    if (!body) return
    setFail("")
    try {
      await send({ id, text: body }).unwrap()
      setText("")
    } catch (err) { setFail(errText(err)) }
  }
  const key = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void go()
    }
  }
  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-2xl flex-col gap-3 lg:h-[calc(100dvh-7rem)]">
      <div className="flex items-center justify-between"><h1 className="text-title font-semibold">{t("chat")}</h1><Link href={`/trips/${id}`} className="text-sm text-primary">{t("backTrip")}</Link></div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto" aria-live="polite">
        {msgs.isLoading && <SpinnerIcon size={20} className="animate-spin text-muted" />}
        {msgs.data && !count && <p className="text-muted">{t("chatEmpty")}</p>}
        {msgs.data?.map((m) => {
          const mine = m.senderId === me.data?.id
          return <div key={m.id} className={`flex max-w-[80%] flex-col rounded-2xl px-4 py-2 ${mine ? "self-end bg-primary text-on-primary" : "self-start bg-surface text-ink"}`}><span className="whitespace-pre-wrap">{m.text}</span><span className="self-end text-xs">{clock(m.at)}</span></div>
        })}
        <div ref={end} />
      </div>
      {!open && <p className="text-sm text-muted">{t("chatClosed")}</p>}
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      {open && (
        <div className="flex items-end gap-2">
          <textarea value={text} maxLength={500} rows={2} onChange={(e) => setText(e.target.value)} onKeyDown={key} placeholder={t("chatHint")} aria-label={t("chatHint")} className="min-h-14 flex-1 rounded-2xl bg-surface p-3 text-base text-ink outline-hidden placeholder:text-muted" />
          <button type="button" onClick={go} disabled={sending.isLoading || !text.trim()} aria-label="Send (Control + Enter)" title="Send (Control + Enter)" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary outline-hidden disabled:opacity-50"><SendIcon size={22} /></button>
        </div>
      )}
    </div>
  )
}
