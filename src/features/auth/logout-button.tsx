"use client"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { LogoutIcon } from "@/components/icons"
import { baseApi } from "@/store/api"
import { useAppDispatch } from "@/store"
import { useLogoutMutation } from "@/features/auth/api"

export function LogoutButton({ icon = false }: { icon?: boolean }) {
  const t = useTranslations("auth")
  const tp = useTranslations("prefs")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [logout, { isLoading }] = useLogoutMutation()
  const go = async () => {
    await logout()
    dispatch(baseApi.util.resetApiState())
    router.replace("/login")
    router.refresh()
  }
  if (icon) return <button type="button" onClick={go} disabled={isLoading} aria-label={tp("logout")} title={tp("logout")} className="flex size-11 items-center justify-center rounded-2xl bg-surface text-ink outline-hidden disabled:opacity-50"><LogoutIcon size={20} /></button>
  return <button type="button" onClick={go} disabled={isLoading} className="text-center text-sm text-muted outline-hidden">{t("logout")}</button>
}
