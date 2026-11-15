"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { errText } from "@/lib/errors"
import { useConfirmEmailMutation } from "@/features/auth/api"

export function ConfirmLink({ token }: { token: string }) {
  const t = useTranslations("auth")
  const [confirm, { isLoading }] = useConfirmEmailMutation()
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle")
  const [fail, setFail] = useState("")
  const go = async () => {
    try {
      await confirm({ token }).unwrap()
      setState("ok")
    } catch (err) {
      setFail(errText(err))
      setState("bad")
    }
  }
  if (!token) return <p className="text-muted">{t("confirmBad")}</p>
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{state === "ok" ? t("confirmOk") : t("confirmTitle")}</h1>
      {state === "bad" && <p role="alert" className="text-danger">{fail || t("confirmBad")}</p>}
      {state === "ok" ? <Link href="/" className="flex h-12 items-center justify-center rounded-2xl bg-primary px-5 font-medium text-on-primary">{t("continue")}</Link> : <Button onClick={go} disabled={isLoading}>{t("confirmBtn")}</Button>}
    </div>
  )
}
