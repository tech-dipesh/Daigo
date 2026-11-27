"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useDemoGetQuery, useDemoRunMutation } from "@/features/admin/api"
import type { Obj } from "@/features/admin/api"
import { demoTabs } from "@/features/admin/demo-tabs"
import type { DemoTab } from "@/features/admin/demo-tabs"
import { Title, field } from "@/features/admin/ui"

const scenarios = ["all", "normal-match", "no-driver", "double-accept", "emergency", "cancel-after-accept", "payment-mismatch", "vulnerable-request"]

function Value({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="text-muted">-</span>
  if (typeof v === "boolean") return <span className={v ? "text-success" : "text-danger"}>{String(v)}</span>
  if (typeof v !== "object") return <span>{String(v)}</span>
  if (Array.isArray(v)) return <ul className="flex flex-col gap-1">{v.map((x, i) => <li key={i} className="rounded-xl bg-tint px-3 py-2"><Value v={x} /></li>)}</ul>
  return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">{Object.entries(v).map(([k, x]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="min-w-0 wrap-break-word"><Value v={x} /></dd></div>)}</dl>
}

export function DemoHub() {
  const t = useTranslations("admin")
  return (
    <div className="flex flex-col gap-3">
      <Title>{t("nav_demo")}</Title>
      <p className="text-muted">{t("demoHelp")}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{demoTabs.map((x) => <li key={x}><Link href={`/admin/demo/${x}`} className="flex h-full flex-col gap-1 rounded-2xl bg-surface p-4"><span className="font-medium text-ink">{t(`demo_${x}`)}</span><span className="text-muted">{t(`demo_${x}_help`)}</span></Link></li>)}</ul>
    </div>
  )
}

export function DemoPage({ tab }: { tab: DemoTab }) {
  const t = useTranslations("admin")
  const [run, running] = useDemoRunMutation()
  const [result, setResult] = useState<Obj | null>(null)
  const [fail, setFail] = useState("")
  const [size, setSize] = useState("full")
  const [name, setName] = useState("all")
  const [ids, setIds] = useState({ requestId: "", routeId: "", tripId: "" })
  const read = useDemoGetQuery(tab === "status" ? "status" : "health", { skip: tab !== "status" && tab !== "health" })
  const post = async (url: string, body?: Obj) => {
    setFail("")
    setResult(null)
    try { setResult(await run({ url, body }).unwrap()) } catch (err) { setFail(errText(err)) }
  }
  const out = tab === "status" || tab === "health" ? read.data : result
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Title aside={<Link href="/admin/demo" className="text-primary">{t("allDemos")}</Link>}>{t(`demo_${tab}`)}</Title>
      <p className="text-muted">{t(`demo_${tab}_help`)}</p>
      {tab === "seed" && <><select value={size} onChange={(e) => setSize(e.target.value)} aria-label={t("size")} className={`${field} h-11`}><option value="full">{t("sizeFull")}</option><option value="quick">{t("sizeQuick")}</option></select><Button onClick={() => post("seed", { size })} disabled={running.isLoading}>{t("run")}</Button></>}
      {tab === "reset" && <Button look="danger" onClick={() => post("reset")} disabled={running.isLoading}>{t("run")}</Button>}
      {tab === "scenarios" && <><select value={name} onChange={(e) => setName(e.target.value)} aria-label={t("scenario")} className={`${field} h-11`}>{scenarios.map((s) => <option key={s} value={s}>{s}</option>)}</select><Button onClick={() => post("scenarios", { name })} disabled={running.isLoading}>{t("run")}</Button></>}
      {tab === "benchmark" && <Button onClick={() => post("benchmark", {})} disabled={running.isLoading}>{t("run")}</Button>}
      {tab === "force" && (
        <div className="flex flex-col gap-3">
          <input value={ids.requestId} onChange={(e) => setIds({ ...ids, requestId: e.target.value.trim() })} placeholder={t("requestId")} aria-label={t("requestId")} className={`${field} h-11`} />
          <input value={ids.routeId} onChange={(e) => setIds({ ...ids, routeId: e.target.value.trim() })} placeholder={t("routeId")} aria-label={t("routeId")} className={`${field} h-11`} />
          <input value={ids.tripId} onChange={(e) => setIds({ ...ids, tripId: e.target.value.trim() })} placeholder={t("tripId")} aria-label={t("tripId")} className={`${field} h-11`} />
          <div className="grid gap-2 sm:grid-cols-3"><Button onClick={() => post("force/assign", { requestId: ids.requestId, routeId: ids.routeId })} disabled={running.isLoading || !ids.requestId || !ids.routeId}>{t("forceAssign")}</Button><Button look="quiet" onClick={() => post("force/expire", { requestId: ids.requestId })} disabled={running.isLoading || !ids.requestId}>{t("forceExpire")}</Button><Button look="quiet" onClick={() => post("force/arrival", { tripId: ids.tripId })} disabled={running.isLoading || !ids.tripId}>{t("forceArrival")}</Button></div>
        </div>
      )}
      {running.isLoading && <p className="text-muted">{t("running")}</p>}
      <p role="alert" className="min-h-5 text-danger">{fail}</p>
      {(read.isLoading && (tab === "status" || tab === "health")) && <p className="text-muted">{t("loading")}</p>}
      {out && <section className="rounded-2xl bg-surface p-4" aria-live="polite"><h2 className="mb-2 font-semibold">{t("result")}</h2><Value v={out} /></section>}
    </div>
  )
}
