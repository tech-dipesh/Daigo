"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Slide } from "@/components/ui/slide"
import { errText } from "@/lib/errors"
import { baseApi } from "@/store/api"
import { useAppDispatch } from "@/store"
import { useDeleteMeMutation } from "@/features/me/api"

export function DeleteAccount() {
  const t = useTranslations("me")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [remove] = useDeleteMeMutation()
  const [password, setPassword] = useState("")
  const [fail, setFail] = useState("")
  const go = async () => {
    setFail("")
    try {
      await remove(password).unwrap()
      dispatch(baseApi.util.resetApiState())
      router.replace("/login")
      router.refresh()
    } catch (err) { setFail(errText(err)) }
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-title font-semibold text-danger">{t("delete")}</h1>
      <p className="text-muted">{t("deleteHelp")}</p>
      <Input label={t("currentPassword")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p role="alert" className="min-h-5 text-sm text-danger">{fail}</p>
      <Slide label={t("slideDelete")} lockedLabel={t("lockedDelete")} locked={!password} onDoneAction={go} />
    </div>
  )
}
