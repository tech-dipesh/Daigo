"use client"
import { useState } from "react"
import Image from "next/image"
import { UserIcon } from "@/components/icons"
import { useAppSelector } from "@/store"

export function Avatar({ id, size = 56 }: { id?: string; size?: number }) {
  const version = useAppSelector((s) => s.ui.photoV)
  const [broken, setBroken] = useState("")
  const src = `/api/v1/photos/${id}?v=${version}`
  const box = { width: size, height: size }
  if (!id || broken === src) return <span style={box} className="flex shrink-0 items-center justify-center rounded-full bg-tint text-muted"><UserIcon size={size / 2} /></span>
  return <Image src={src} alt="" width={size} height={size} unoptimized onError={() => setBroken(src)} className="shrink-0 rounded-full object-cover" style={box} />
}
