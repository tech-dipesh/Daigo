"use client"
import { useEffect, useRef } from "react"
import { api } from "@/lib/api"
import type { Envelope } from "@/lib/api"
import { WS } from "@/lib/env"
import { baseApi } from "@/store/api"
import { useAppDispatch, useAppSelector } from "@/store"
import { restore } from "@/store/away"
import type { Away } from "@/store/away"
import { comeBack } from "@/store/away"
import { received, status } from "@/store/realtime"
import type { RealtimeEvent } from "@/store/realtime"

type Tag = "Trip" | "Request" | "Notification" | "Chat" | "Match" | "Offer"

const key = "daigo.away"
const tags: Record<string, Tag[]> = { "trip.status": ["Trip"], "match.accepted": ["Trip", "Request"], "offer.new": ["Request", "Offer"], notification: ["Notification"], "chat.message": ["Chat"], "request.new": ["Match"] }

const saved = (): Away => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null") as Away
    return raw && (raw.until === null || raw.until > Date.now()) ? raw : null
  } catch { return null }
}

export function Realtime({ driver }: { driver: boolean }) {
  const dispatch = useAppDispatch()
  const away = useAppSelector((s) => s.away.away)
  const loaded = useAppSelector((s) => s.away.loaded)
  const awayRef = useRef(away)
  const socket = useRef<WebSocket | null>(null)
  const fallback = useRef(false)
  const beat = async () => {
    if (!driver) return
    try { await api.post("/presence", { online: !awayRef.current }) } catch { return }
  }
  const presence = () => (socket.current?.readyState === WebSocket.OPEN ? socket.current.send(JSON.stringify({ type: driver && !awayRef.current ? "online" : "offline" })) : fallback.current ? void beat() : undefined)
  useEffect(() => {
    dispatch(restore(saved()))
  }, [dispatch])
  useEffect(() => {
    awayRef.current = away
    if (loaded) {
      if (away) localStorage.setItem(key, JSON.stringify(away))
      else localStorage.removeItem(key)
    }
    presence()
    if (!away?.until) return
    const timer = setTimeout(() => dispatch(comeBack()), Math.max(0, away.until - Date.now()))
    return () => clearTimeout(timer)
  }, [away, loaded])
  useEffect(() => {
    let closed = false
    let tries = 0
    let retry: ReturnType<typeof setTimeout> | undefined
    let ping: ReturnType<typeof setInterval> | undefined
    let poll: ReturnType<typeof setInterval> | undefined
    let heartbeat: ReturnType<typeof setInterval> | undefined
    const handle = (e: RealtimeEvent) => {
      dispatch(received(e))
      const hit = tags[e.type]
      if (hit) dispatch(baseApi.util.invalidateTags(hit))
    }
    const drain = async () => {
      try {
        const res = await api.get<Envelope<RealtimeEvent[]>>("/events")
        if (res.data.success) res.data.data.forEach(handle)
      } catch { return }
    }
    /* production goes through caddy on the same host, dev needs NEXT_PUBLIC_WS or it just polls */
    const base = WS || (process.env.NODE_ENV === "production" ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}` : "")
    const fallbackOn = () => {
      if (poll) return
      fallback.current = true
      poll = setInterval(drain, 5000)
      heartbeat = setInterval(beat, 30000)
      void beat()
    }
    const open = () => {
      const ws = new WebSocket(`${base}/api/v1/ws`)
      socket.current = ws
      ws.onopen = () => {
        tries = 0
        clearInterval(poll)
        clearInterval(heartbeat)
        poll = undefined
        fallback.current = false
        dispatch(status({ live: true, fallback: false }))
        presence()
        ping = setInterval(() => ws.send(JSON.stringify({ type: "ping" })), 30000)
      }
      ws.onmessage = (m) => {
        const msg = JSON.parse(String(m.data)) as { type: string }
        if (msg.type !== "ready" && msg.type !== "error") handle(msg as RealtimeEvent)
      }
      ws.onclose = () => {
        clearInterval(ping)
        socket.current = null
        tries++
        dispatch(status({ live: false, fallback: tries >= 3 }))
        if (closed) return
        if (tries >= 3) fallbackOn()
        retry = setTimeout(open, Math.min(1000 * 2 ** tries, 15000))
      }
    }
    if (base) open()
    else {
      dispatch(status({ live: false, fallback: true }))
      fallbackOn()
    }
    return () => {
      closed = true
      clearTimeout(retry)
      clearInterval(ping)
      clearInterval(poll)
      clearInterval(heartbeat)
      socket.current?.close()
    }
  }, [dispatch, driver])
  return null
}
