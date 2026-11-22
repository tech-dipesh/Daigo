"use client"
import { useTranslations } from "next-intl"
import { dayMonth } from "@/lib/time"
import { useReviewsQuery } from "@/features/me/api"

export function Reviews() {
  const t = useTranslations("me")
  const tt = useTranslations("trips")
  const { data } = useReviewsQuery()
  if (!data) return null
  return (
    <section className="flex flex-col gap-2" aria-label={t("reviewsTitle")}>
      <h2 className="text-lg font-semibold">{t("reviewsTitle")}</h2>
      {!data.items.length && <p className="text-muted">{t("reviewsEmpty")}</p>}
      {data.average !== null && data.items.length > 0 && <p className="text-sm text-muted">{t("reviewsAvg", { avg: data.average.toFixed(1), count: data.count })}</p>}
      <ul className="flex flex-col gap-2">
        {data.items.map((r, i) => (
          <li key={i} className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
            <span className="flex items-center justify-between text-sm text-muted"><span>{t("reviewStars", { count: r.score })}</span><span>{dayMonth(r.createdAt)}</span></span>
            <span className="text-ink">{r.review}</span>
            {r.route && <span className="truncate text-sm text-muted">{r.route}</span>}
            {r.recommendTag && <span className="self-start rounded-xl bg-tint px-3 py-1 text-sm text-primary">{tt(`tag_${r.recommendTag}`)}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
