import Link from "next/link"
import { getTranslations } from "next-intl/server"

const parts = ["what", "cost", "safety", "accounts", "privacy", "limits"]

export default async function Page() {
  const t = await getTranslations("terms")
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted">{t("notice")}</p>
      {parts.map((p) => <section key={p} className="flex flex-col gap-1"><h2 className="text-lg font-semibold">{t(`${p}_h`)}</h2><p className="text-ink">{t(`${p}_b`)}</p></section>)}
      <Link href="/" className="text-primary">{t("back")}</Link>
    </article>
  )
}
