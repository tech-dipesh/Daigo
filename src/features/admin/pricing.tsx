"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useFaresQuery, usePatchFareMutation, usePatchZoneMutation, useZonesQuery } from "@/features/admin/api"
import type { Fare, Zone } from "@/features/admin/api"
import { State, Title, cell, field } from "@/features/admin/ui"

function ZoneRow({ z }: { z: Zone }) {
  const t = useTranslations("admin")
  const [patch, busy] = usePatchZoneMutation()
  const [value, setValue] = useState(String(z.multiplier))
  const [fail, setFail] = useState("")
  const next = Number(value)
  const ok = Number.isFinite(next) && next >= 0.5 && next <= 3 && next !== z.multiplier
  const go = async () => {
    setFail("")
    try { await patch({ id: z.id, multiplier: next }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  return (
    <tr className="odd:bg-surface">
      <td className={cell}>{z.name}</td>
      <td className={`${cell} text-muted`}>{z.minLat.toFixed(2)}..{z.maxLat.toFixed(2)}, {z.minLng.toFixed(2)}..{z.maxLng.toFixed(2)}</td>
      <td className={cell}><input type="number" step={0.05} min={0.5} max={3} value={value} onChange={(e) => setValue(e.target.value)} aria-label={t("multiplier")} className={`${field} w-24 bg-tint`} /></td>
      <td className={cell}><Button look="quiet" className="h-9 px-3 text-sm" onClick={go} disabled={!ok || busy.isLoading}>{t("save")}</Button>{fail && <span role="alert" className="ml-2 text-danger">{fail}</span>}</td>
    </tr>
  )
}

export function Zones() {
  const t = useTranslations("admin")
  const list = useZonesQuery()
  return (
    <div className="flex flex-col gap-3">
      <Title>{t("nav_zones")}</Title>
      <p className="text-muted">{t("zonesHelp")}</p>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      {list.data && list.data.length > 0 && <div className="overflow-x-auto rounded-2xl"><table className="w-full"><thead><tr className="text-muted"><th className={cell}>{t("zone")}</th><th className={cell}>{t("bounds")}</th><th className={cell}>{t("multiplier")}</th><th className={cell} /></tr></thead><tbody>{list.data.map((z) => <ZoneRow key={z.id} z={z} />)}</tbody></table></div>}
    </div>
  )
}

function FareRow({ f }: { f: Fare }) {
  const t = useTranslations("admin")
  const [patch, busy] = usePatchFareMutation()
  const [value, setValue] = useState(String(f.perKm))
  const [fail, setFail] = useState("")
  const next = Number(value)
  const ok = Number.isFinite(next) && next >= 1 && next <= 40 && next !== f.perKm
  const go = async () => {
    setFail("")
    try { await patch({ type: f.vehicleType, perKm: next }).unwrap() } catch (err) { setFail(errText(err)) }
  }
  return (
    <tr className="odd:bg-surface">
      <td className={cell}>{f.vehicleType}</td>
      <td className={cell}><input type="number" step={0.5} min={1} max={40} value={value} onChange={(e) => setValue(e.target.value)} aria-label={t("perKm")} className={`${field} w-24 bg-tint`} /></td>
      <td className={cell}><Button look="quiet" className="h-9 px-3 text-sm" onClick={go} disabled={!ok || busy.isLoading}>{t("save")}</Button>{fail && <span role="alert" className="ml-2 text-danger">{fail}</span>}</td>
    </tr>
  )
}

export function Fares() {
  const t = useTranslations("admin")
  const list = useFaresQuery()
  return (
    <div className="flex flex-col gap-3">
      <Title>{t("nav_fares")}</Title>
      <p className="text-muted">{t("faresHelp")}</p>
      <State loading={list.isLoading} error={list.isError} empty={Boolean(list.data) && !list.data?.length} emptyText={t("nothing")} errorText={t("loadFail")} />
      {list.data && list.data.length > 0 && <div className="overflow-x-auto rounded-2xl"><table className="w-full"><thead><tr className="text-muted"><th className={cell}>{t("vehicle")}</th><th className={cell}>{t("perKm")}</th><th className={cell} /></tr></thead><tbody>{list.data.map((f) => <FareRow key={f.id} f={f} />)}</tbody></table></div>}
    </div>
  )
}
