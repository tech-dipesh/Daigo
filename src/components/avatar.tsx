"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { SpinnerIcon, UserIcon } from "@/components/icons"
import { useAppSelector } from "@/store"

const giveUp = 15000

export function Avatar({ id, url, size = 56 }: { id?: string; url?: string | null; size?: number }) {
  const t = useTranslations("common")
  const version = useAppSelector((s) => s.ui.photoV)
  const [broken, setBroken] = useState("")
  const [loaded, setLoaded] = useState("")
  const [slow, setSlow] = useState("")
  const src = url ?? `/api/v1/photos/${id}?v=${version}`
  const has = Boolean(url ?? id)
  const box = { width: size, height: size }
  const waiting = has && loaded !== src && slow !== src
  useEffect(() => {
    if (!has) return
    const timer = setTimeout(() => setSlow(src), giveUp)
    return () => clearTimeout(timer)
  }, [has, src])
  const ghost = "flex shrink-0 items-center justify-center rounded-full bg-tint text-muted"
  if (!has || broken === src) return <span style={box} className={ghost}><UserIcon size={size / 2} /></span>
  return (
    <span style={box} className="relative inline-flex shrink-0" aria-busy={waiting}>
      <span style={box} className={`absolute inset-0 ${ghost}`}>{waiting ? <SpinnerIcon size={size / 3} className="animate-spin" /> : <UserIcon size={size / 2} />}</span>
      {waiting && <span className="sr-only" role="status">{t("loading")}</span>}
      <Image ref={(el) => { if (el?.complete && el.naturalWidth) setLoaded(src) }} src={src} alt="" width={size} height={size} unoptimized loading="eager" onLoad={() => setLoaded(src)} onError={() => setBroken(src)} className={`relative rounded-full object-cover transition-opacity duration-200 ${loaded === src ? "opacity-100" : "opacity-0"}`} style={box} />
    </span>
  )
}


/*
  adding a cahced photo can also finish
  react attached on load
  which check our complete too
*/