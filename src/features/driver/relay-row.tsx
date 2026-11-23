"use client"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowIcon } from "@/components/icons"
import { useCountdown } from "@/features/rider/use-countdown"
import type { RelayOffer } from "@/features/driver/api"

export function RelayRow({ item }: { item: RelayOffer }) {
  const t = useTranslations("relay")
  const left = useCountdown(item.expiresAt)
  return (
    <li>
      <Link href={`/driver/relay/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
        <span className="flex min-w-0 flex-col"><span className="text-xs text-primary">{t(item.leg === "FIRST" ? "badgeFirst" : "badgeSecond")}</span><span className="truncate text-ink">{item.from} - {item.to}</span><span className="text-sm text-muted">{t("people", { count: item.groupSize })} · ₹{item.price} · {left ?? 0}s</span></span>
        <ArrowIcon size={18} />
      </Link>
    </li>
  )
}
