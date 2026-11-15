"use client"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { baseApi } from "@/store/api"
import { useAppDispatch } from "@/store"
import { useLogoutMutation } from "@/features/auth/api"

export function LogoutButton() {
  const t = useTranslations("auth")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [logout, { isLoading }] = useLogoutMutation()
  const go = async () => {
    await logout()
    dispatch(baseApi.util.resetApiState())
    router.replace("/login")
    router.refresh()
  }
  return <button type="button" onClick={go} disabled={isLoading} className="text-center text-sm text-muted outline-hidden">{t("logout")}</button>
}
