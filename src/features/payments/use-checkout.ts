import { useState } from "react"
import { useVerifyPaymentMutation } from "@/features/payments/api"
import { openCheckout } from "@/features/payments/checkout"
import type { Checkout } from "@/features/payments/checkout"

export type Outcome = "paid" | "waiting" | "cancelled"

export function useCheckout() {
  const [verify] = useVerifyPaymentMutation()
  const [busy, setBusy] = useState(false)
  const run = async (c: Checkout): Promise<Outcome> => {
    setBusy(true)
    try {
      const proof = await openCheckout(c)
      if (!proof) return "cancelled"
      const done = await verify(proof).unwrap()
      return done.paid ? "paid" : "waiting"
    } finally { setBusy(false) }
  }
  return { run, busy }
}
