import { getTranslations } from "next-intl/server"
import { SosPanel } from "@/features/safety/sos"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EmergencyPage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const t = await getTranslations("emergency")
  const { trip } = await searchParams
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
      <a href="tel:112" className="flex h-20 items-center justify-center rounded-2xl bg-danger text-title font-semibold text-on-primary">{t("call")}</a>
      <SosPanel tripId={trip && uuid.test(trip) ? trip : undefined} />
    </div>
  )
}
