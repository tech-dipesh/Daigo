import { getTranslations } from "next-intl/server"

export default async function EmergencyPage() {
  const t = await getTranslations("emergency")
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
      <a href="tel:112" className="flex h-20 items-center justify-center rounded-2xl bg-danger text-title font-semibold text-on-primary">{t("call")}</a>
    </div>
  )
}
