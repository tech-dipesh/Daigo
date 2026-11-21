"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { CheckIcon, StarIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"

const total = 5
const places = ["place0", "place1", "place2", "place3"]

function Ask() {
  const t = useTranslations("tutorial")
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(2)
  const fare = 20 + Math.abs(to - from) * 14
  const pick = (value: number, set: (n: number) => void) => <div className="flex flex-wrap gap-2">{places.map((p, i) => <button key={p} type="button" aria-pressed={value === i} onClick={() => set(i)} className={`h-11 rounded-2xl px-4 text-sm outline-hidden ${value === i ? "bg-primary text-on-primary" : "bg-surface text-ink"}`}>{t(p)}</button>)}</div>
  return <div className="flex flex-col gap-3"><p className="text-sm text-muted">{t("from")}</p>{pick(from, setFrom)}<p className="text-sm text-muted">{t("to")}</p>{pick(to, setTo)}<p className="rounded-2xl bg-primary p-4 text-on-primary">{t("exampleFare")} <span className="text-title font-semibold">₹{from === to ? 0 : fare}</span></p></div>
}

function Alert() {
  const t = useTranslations("tutorial")
  const [state, setState] = useState<"idle" | "wait" | "done">("idle")
  const send = () => {
    setState("wait")
    setTimeout(() => setState("done"), 2500)
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="h-3 overflow-hidden rounded-full bg-tint"><div className={`h-full rounded-full bg-primary transition-[width] ease-linear ${state === "wait" ? "duration-2500" : "duration-300"}`} style={{ width: state === "idle" ? "0%" : "100%" }} /></div>
      <p aria-live="polite" className="text-ink">{state === "idle" ? t("alertIdle") : state === "wait" ? t("alertWait") : t("alertDone")}</p>
      <Button onClick={send} disabled={state === "wait"}>{t("sendDemo")}</Button>
    </div>
  )
}

function Price() {
  const t = useTranslations("tutorial")
  const [price, setPrice] = useState(90)
  const state = price < 70 ? "low" : price > 120 ? "high" : "ok"
  return <div className="flex flex-col gap-3"><p className="text-title font-semibold text-primary">₹{price}</p><input type="range" min={50} max={140} value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label={t("priceLabel")} /><p className={state === "ok" ? "text-success" : "text-danger"}>{t(`price_${state}`)}</p><p className="rounded-2xl bg-tint p-3 text-sm text-ink">{t("decideFast")}</p></div>
}

function Safe() {
  const t = useTranslations("tutorial")
  const [on, setOn] = useState(false)
  return <div className="flex flex-col gap-3"><div className="flex gap-2" aria-label={t("codeLabel")}>{"482195".split("").map((d, i) => <span key={i} className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-surface text-title font-semibold text-ink">{d}</span>)}</div><Toggle label={t("shareLive")} on={on} onChangeAction={setOn} />{on && <p className="rounded-2xl bg-tint p-3 text-sm text-ink">{t("shareLink")}</p>}</div>
}

function Finish() {
  const t = useTranslations("tutorial")
  const [cash, setCash] = useState(false)
  const [stars, setStars] = useState(4)
  return (
    <div className="flex flex-col gap-3">
      <Toggle label={t("cash")} hint={cash ? t("cashHint") : t("onlineHint")} on={cash} onChangeAction={setCash} />
      <div role="radiogroup" aria-label={t("stars")} className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => setStars(n)} className={`flex h-14 flex-1 items-center justify-center rounded-2xl outline-hidden ${n <= stars ? "bg-primary text-on-primary" : "bg-surface text-muted"}`}><StarIcon size={24} className={n <= stars ? "fill-current" : ""} /></button>)}</div>
    </div>
  )
}

const widgets = [Ask, Alert, Price, Safe, Finish]

export function Tutorial() {
  const t = useTranslations("tutorial")
  const [step, setStep] = useState(0)
  const [seen, setSeen] = useState<number[]>([0])
  const go = (n: number) => {
    setStep(n)
    setSeen(seen.includes(n) ? seen : [...seen, n])
  }
  const percent = Math.round((seen.length / total) * 100)
  const Widget = widgets[step]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><h1 className="text-title font-semibold">{t("title")}</h1><Link href="/" className="text-sm text-primary">{t("skip")}</Link></div>
      <div className="flex flex-col gap-1"><div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t("read", { percent })} className="h-2 overflow-hidden rounded-full bg-tint"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} /></div><p className="text-sm text-muted">{t("read", { percent })}</p></div>
      <ol className="flex gap-2 overflow-x-auto" aria-label={t("steps")}>
        {Array.from({ length: total }, (_, i) => <li key={i}><button type="button" aria-current={step === i ? "step" : undefined} onClick={() => go(i)} className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-2xl px-3 text-sm outline-hidden ${step === i ? "bg-primary text-on-primary" : seen.includes(i) ? "bg-tint text-ink" : "bg-surface text-muted"}`}>{seen.includes(i) && step !== i ? <CheckIcon size={14} /> : null}{i + 1}</button></li>)}
      </ol>
      <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5" aria-live="polite">
        <h2 className="text-lg font-semibold">{t(`s${step + 1}_h`)}</h2>
        <p className="text-muted">{t(`s${step + 1}_b`)}</p>
        <Widget />
      </section>
      <div className="grid grid-cols-2 gap-2"><Button look="quiet" onClick={() => go(step - 1)} disabled={step === 0}>{t("previous")}</Button>{step < total - 1 ? <Button onClick={() => go(step + 1)}>{t("next")}</Button> : <Link href="/signup" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("start")}</Link>}</div>
    </div>
  )
}
