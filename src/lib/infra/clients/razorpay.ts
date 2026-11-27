import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"

const base = "https://api.razorpay.com/v1"

export const razorpayOn = Boolean(env.RZP_KEY && env.RZP_SECRET)

export type Order = { id: string; amount: number; amount_paid: number; currency: string; status: string; notes: Record<string, string> }

async function call<T>(path: string, init?: RequestInit) {
  const basic = Buffer.from(`${env.RZP_KEY}:${env.RZP_SECRET}`).toString("base64")
  const res = await fetch(`${base}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Basic ${basic}` } })
  if (!res.ok) {
    console.error("razorpay failed", res.status, await res.text())
    throw new AppError("The payment gateway did not answer, please try again", 502)
  }
  return (await res.json()) as T
}

export const createOrder = (rupees: number, notes: Record<string, string>) => call<Order>("/orders", { method: "POST", body: JSON.stringify({ amount: rupees * 100, currency: "INR", receipt: `daigo_${Date.now()}`, notes }) })
export type PaymentInfo = { id: string; status: string; order_id: string | null }
export const fetchPayment = (id: string) => call<PaymentInfo>(`/payments/${id}`)
export const fetchOrderPayments = (orderId: string) => call<{ items: PaymentInfo[] }>(`/orders/${orderId}/payments`)
export const fetchOrder = (id: string) => call<Order>(`/orders/${id}`)

const same = (a: string, b: string) => {
  // Apply Uint8Array for the newer node type
  const x = Uint8Array.from(Buffer.from(a))
  const y = Uint8Array.from(Buffer.from(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

// Signed our secret
export const checkoutSignatureOk = (orderId: string, paymentId: string, signature: string) => same(createHmac("sha256", env.RZP_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex"), signature)

// Webhook are signed with the raw body
export const webhookSignatureOk = (raw: string, signature: string) => Boolean(env.RZP_HOOK) && same(createHmac("sha256", env.RZP_HOOK ?? "").update(raw).digest("hex"), signature)
