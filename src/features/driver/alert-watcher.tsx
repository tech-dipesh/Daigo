"use client"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { unlockAudio } from "@/features/driver/siren"
import { useAppDispatch, useAppSelector } from "@/store"
import { consumed } from "@/store/realtime"

export function AlertWatcher() {
  const router = useRouter()
  const path = usePathname()
  const dispatch = useAppDispatch()
  const events = useAppSelector((s) => s.realtime.events)
  const away = useAppSelector((s) => s.away.away)
  useEffect(() => {
    unlockAudio()
  }, [])
  useEffect(() => {
    const e = events.find((x) => x.type === "request.new")
    if (!e) return
    dispatch(consumed(e.id))
    const ends = e.data.expiresAt ? new Date(String(e.data.expiresAt)).getTime() : Infinity
    if (away || ends <= Date.now() || path.startsWith("/driver/incoming/") || path.startsWith("/driver/relay/")) return
    router.push(e.data.relayMatchId ? `/driver/relay/${String(e.data.relayMatchId)}` : `/driver/incoming/${String(e.data.matchId)}`)
  }, [events, away, path, router, dispatch])
  return null
}
