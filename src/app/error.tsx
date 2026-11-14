"use client"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-title font-semibold">{t("errors.title")}</h1>
      <p className="text-muted">{t("errors.body")}</p>
      <Button onClick={reset}>{t("common.retry")}</Button>
      <a href="tel:112" className="text-center text-danger">{t("errors.call112")}</a>
    </main>
  )
}
