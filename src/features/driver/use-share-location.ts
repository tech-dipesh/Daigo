import { useEffect, useRef, useState } from "react"
import { useSendLocationMutation } from "@/features/driver/trip-api"

export function useShareLocation(id: string, active: boolean) {
  const [send] = useSendLocationMutation()
  const [state, setState] = useState<"idle" | "sharing" | "denied">("idle")
  const last = useRef(0)
  useEffect(() => {
    if (!active || !("geolocation" in navigator)) return
    let lock: WakeLockSentinel | null = null
    const keep = async () => {
      try { lock = await navigator.wakeLock.request("screen") } catch { return }
    }
    void keep()
    const watch = navigator.geolocation.watchPosition((pos) => {
      setState("sharing")
      if (Date.now() - last.current < 12000) return
      last.current = Date.now()
      void send({ id, lat: pos.coords.latitude, lng: pos.coords.longitude })
    }, () => setState("denied"), { enableHighAccuracy: true, maximumAge: 5000 })
    return () => {
      navigator.geolocation.clearWatch(watch)
      void lock?.release()
    }
  }, [active, id, send])
  return state
}
