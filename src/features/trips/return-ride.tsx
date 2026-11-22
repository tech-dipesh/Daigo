"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { clock, dayMonth } from "@/lib/time"
import { useCreateRequestMutation, useListRequestsQuery } from "@/features/rider/api"
import { useTripPlacesQuery } from "@/features/driver/trip-api"
import { useReturnOptionsQuery } from "@/features/trips/api"
import type { ReturnRoute } from "@/features/trips/api"

const minute = 60000
const day = 24 * 60 * minute

/* next time this route leaves, as a real moment. regular routes store utc days and time */
function nextDeparture(r: ReturnRoute) {
  const hm = r.departureTime.slice(11, 16)
  const now = Date.now()
  if (r.routeType === "ADVANCE" && r.departureDate) {
    const once = new Date(`${r.departureDate.slice(0, 10)}T${hm}:00Z`)
    return once.getTime() > now + 10 * minute ? once : null
  }
  const tries = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => new Date(`${new Date(now + n * day).toISOString().slice(0, 10)}T${hm}:00Z`))
  return tries.find((d) => d.getTime() > now + 10 * minute && r.daysOfWeek.includes(d.getUTCDay())) ?? null
}

export function ReturnRide({ id, requestId }: { id: string; requestId: string }) {
  const t = useTranslations("trips")
  const router = useRouter()
  const options = useReturnOptionsQuery(id)
  const places = useTripPlacesQuery(id)
  const requests = useListRequestsQuery()
  const [create, creating] = useCreateRequestMutation()
  const [fail, setFail] = useState("")
  const route = options.data?.find((r) => nextDeparture(r))
  const leaves = route ? nextDeparture(route) : null
  const p = places.data
  if (!route || !leaves || !p) return null
  const people = requests.data?.find((r) => r.id === requestId)?.groupSize ?? 1
  const go = async () => {
    setFail("")
    const start = new Date(Math.max(leaves.getTime() - 30 * minute, Date.now() + 2 * minute))
    const end = new Date(leaves.getTime() + 30 * minute)
    try {
      const made = await create({ fromLabel: p.toLabel, fromLat: p.toLat, fromLng: p.toLng, toLabel: p.fromLabel, toLat: p.fromLat, toLng: p.fromLng, windowStart: start.toISOString(), windowEnd: end.toISOString(), groupSize: people, hasLuggage: false, isVulnerable: false, womenOnly: false, acOnly: false, allowShared: true }).unwrap()
      router.push(`/request/${made.id}/waiting`)
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-tint p-4">
      <h2 className="font-semibold text-ink">{t("returnTitle")}</h2>
      <p className="text-sm text-muted">{t("returnBody", { when: `${dayMonth(leaves)}, ${clock(leaves)}` })}</p>
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Button onClick={go} disabled={creating.isLoading}>{t("returnAsk")}</Button>
    </section>
  )
}
