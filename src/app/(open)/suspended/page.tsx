import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function Page() {
  const t = await getTranslations("suspendedPage")
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("body")}</p>
      <Link href="/me/standing" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("appeal")}</Link>
      <Link href="/terms" className="text-center text-sm text-primary">{t("terms")}</Link>
    </div>
  )
}
