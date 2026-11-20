"use client"
import { useState } from "react"
import Image from "next/image"
import { UserIcon } from "@/components/icons"

export function Avatar({ id, size = 56, bust = "" }: { id?: string; size?: number; bust?: string }) {
  const [broken, setBroken] = useState(false)
  const box = { width: size, height: size }
  if (!id || broken) return <span style={box} className="flex shrink-0 items-center justify-center rounded-full bg-tint text-muted"><UserIcon size={size / 2} /></span>
  return <Image src={`/api/v1/photos/${id}${bust ? `?v=${bust}` : ""}`} alt="" width={size} height={size} unoptimized onError={() => setBroken(true)} className="shrink-0 rounded-full object-cover" style={box} />
}
