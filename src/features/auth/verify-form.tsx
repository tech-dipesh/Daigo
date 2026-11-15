"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { pushToast } from "@/store/ui"
import { useAppDispatch } from "@/store"
import { useResendCodeMutation, useVerifyCodeMutation } from "@/features/auth/api"
import { CodeBoxes } from "@/features/auth/code-boxes"
import { LogoutButton } from "@/features/auth/logout-button"

export function VerifyForm({ email }: { email: string }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [verify] = useVerifyCodeMutation()
  const [resend] = useResendCodeMutation()
  const [code, setCode] = useState("")
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try {
      await verify({ code }).unwrap()
      router.replace("/")
      router.refresh()
    } catch (err) { setFail(errText(err)) }
  }
  const again = async () => {
    setFail("")
    try {
      await resend().unwrap()
      dispatch(pushToast({ key: "auth.resent", kind: "success" }))
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold">{t("verifyTitle")}</h1>
        <p className="text-muted">{t("verifySub", { email })}</p>
      </div>
      <CodeBoxes value={code} onChangeAction={setCode} label={t("codeLabel")} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideVerify")} lockedLabel={t("locked")} locked={code.length < 6} onDone={go} />
      <button type="button" onClick={again} className="text-center text-sm text-primary outline-hidden">{t("resend")}</button>
      <LogoutButton />
    </div>
  )
}
