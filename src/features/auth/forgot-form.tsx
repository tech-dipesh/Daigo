"use client"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useResetRequestMutation } from "@/features/auth/api"
import { emailOk } from "@/features/auth/rules"

export function ForgotForm() {
  const t = useTranslations("auth")
  const [request] = useResetRequestMutation()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try {
      await request({ email }).unwrap()
      setSent(true)
    } catch (err) { setFail(errText(err)) }
  }
  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-semibold">{t("checkMail")}</h1>
        <p className="text-muted">{t("checkMailSub", { email })}</p>
        <Link href="/login" className="text-primary">{t("logIn")}</Link>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("forgotTitle")}</h1>
      <p className="text-muted">{t("forgotSub")}</p>
      <Input label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : t("emailBad")} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideSend")} lockedLabel={t("locked")} locked={!emailOk(email)} onDoneAction={go} />
      <Link href="/login" className="text-center text-sm text-primary">{t("logIn")}</Link>
    </div>
  )
}
