import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function NotFound() {
  const t = await getTranslations()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-title font-semibold">{t("errors.notFoundTitle")}</h1>
      <p className="text-muted">{t("errors.notFoundBody")}</p>
      <Link href="/" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("common.home")}</Link>
    </main>
  )
}
