"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { useSignupMutation } from "@/features/auth/api"
import { PasswordRules, emailOk, passOk } from "@/features/auth/rules"

export function SignupForm({ start = "" }: { start?: string }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [signup] = useSignupMutation()
  const [email, setEmail] = useState(start)
  const [password, setPassword] = useState("")
  const [fail, setFail] = useState("")
  const ready = emailOk(email) && passOk(password)
  const go = async () => {
    setFail("")
    try {
      await signup({ email, password }).unwrap()
      router.replace("/verify-email")
      router.refresh()
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("signupTitle")}</h1>
      <Input label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailOk(email) ? undefined : t("emailBad")} />
      <Input label={t("password")} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passOk(password) ? undefined : t("passBad")} />
      <PasswordRules value={password} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideSignup")} lockedLabel={t("locked")} locked={!ready} onDone={go} />
      <p className="text-center text-sm text-muted">{t("haveAccount")} <Link href={`/login?email=${encodeURIComponent(email)}`} className="text-primary">{t("logIn")}</Link></p>
      <p className="text-center text-xs text-muted"><Link href="/terms" className="text-primary">{t("terms")}</Link></p>
    </div>
  )
}
