import { useEffect, useState } from "react"

export function useCountdown(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])
  return expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)) : null
}
