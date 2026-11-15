"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { useResetConfirmMutation } from "@/features/auth/api"
import { PasswordRules, passOk } from "@/features/auth/rules"

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [confirm] = useResetConfirmMutation()
  const [password, setPassword] = useState("")
  const [fail, setFail] = useState("")
  const [blurred, setBlurred] = useState(false)
  const go = async () => {
    setFail("")
    try {
      await confirm({ token, newPassword: password }).unwrap()
      dispatch(pushToast({ key: "auth.resetOk", kind: "success" }))
      router.replace("/login")
    } catch (err) { setFail(errText(err)) }
  }
  if (!token) return <p className="text-muted">{t("noToken")}</p>
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-semibold">{t("resetTitle")}</h1>
      <Input label={t("newPassword")} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setBlurred(true)} error={passOk(password) ? undefined : t("passBad")} />
      <PasswordRules value={password} touched={blurred} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideReset")} lockedLabel={t("locked")} locked={!passOk(password)} onDoneAction={go} />
    </div>
  )
}
