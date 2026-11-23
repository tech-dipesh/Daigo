"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

type Prompt = Event & { prompt: () => Promise<void> }

export function PwaRegister() {
  useEffect(() => {
    const register = async () => {
      try { await navigator.serviceWorker.register("/sw.js") } catch { return }
    }
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) void register()
  }, [])
  return null
}

export function InstallCard() {
  const t = useTranslations("me")
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [standalone, setStandalone] = useState(true)
  const [ios, setIos] = useState(false)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as Prompt)
    }
    const onInstalled = () => setStandalone(true)
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])
  if (standalone || (!prompt && !ios)) return null
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-tint p-4">
      <h2 className="font-semibold text-ink">{t("installTitle")}</h2>
      <p className="text-sm text-muted">{t(prompt ? "installBody" : "installIos")}</p>
      {prompt && <Button onClick={() => prompt.prompt()}>{t("installButton")}</Button>}
    </section>
  )
}
