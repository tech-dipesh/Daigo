import { z } from "zod"
import { env } from "@/lib/infra/clients/env"
import { redis } from "@/lib/infra/clients/redis"
import { checkoutSignatureOk, createOrder, fetchOrder, fetchOrderPayments, fetchPayment, razorpayOn, webhookSignatureOk } from "@/lib/infra/clients/razorpay"
import { isDemoAccount } from "@/lib/infra/demo/config"
import { AppError } from "@/lib/infra/http/response"
import { notify } from "@/lib/infra/realtime/notify"
import * as paymentRepo from "@/lib/repository/payment/payment-repo"
import * as userRepo from "@/lib/repository/account/user-repo"

export type Checkout = { orderId: string; keyId: string; amount: number; currency: string; description: string; email: string }
type Target = { kind: "payment" | "share"; id: string }
type Paid = { status: string; amount_paid: number }
type Found = NonNullable<Awaited<ReturnType<typeof paymentRepo.findByTrip>>>

const eventSeconds = 7 * 24 * 60 * 60
const targetSchema = z.object({ kind: z.enum(["payment", "share"]), id: z.uuid() })
const notes = z.union([z.record(z.string(), z.string()), z.array(z.unknown())])
const orderShape = z.object({ id: z.string(), amount: z.number(), amount_paid: z.number(), status: z.string(), notes })
const eventSchema = z.object({
  event: z.string(),
  payload: z.object({
    order: z.object({ entity: orderShape }).optional(),
    payment: z.object({ entity: z.object({ id: z.string(), order_id: z.string().nullish() }) }).optional(),
  }),
})

/* demo accounts and a missing key keep the instant mock, everyone else pays through razorpay */
export const gatewayOn = (email: string) => razorpayOn && !isDemoAccount(email)

const targetOf = (raw: unknown) => {
  const parsed = targetSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

async function checkoutFor(target: Target, rupees: number, email: string, description: string): Promise<Checkout> {
  const order = await createOrder(rupees, target)
  if (target.kind === "payment") await paymentRepo.setGatewayRef(target.id, order.id)
  return { orderId: order.id, keyId: env.RZP_KEY ?? "", amount: order.amount, currency: order.currency, description, email }
}

/* the booker pays their own share when the bill is split, otherwise the whole payment */
export async function startCheckout(email: string, payment: Found) {
  const mine = payment.shares.find((share) => share.status === "PENDING" && share.email === email.toLowerCase())
  if (mine) return checkoutFor({ kind: "share", id: mine.id }, mine.amount, email, "Your share of a DaiGo ride")
  if (payment.shares.length) return null
  return checkoutFor({ kind: "payment", id: payment.id }, payment.amount, email, "DaiGo ride payment")
}

export const shareCheckout = (share: { id: string; amount: number }, email: string) => checkoutFor({ kind: "share", id: share.id }, share.amount, email, "Your share of a DaiGo ride")

async function lookup(target: Target) {
  if (target.kind === "payment") {
    const payment = await paymentRepo.findById(target.id)
    return payment ? { rupees: payment.amount, paymentId: payment.id, tripId: payment.tripId, driverId: payment.trip.driverId, riderId: payment.trip.riderId, payerEmail: null } : null
  }
  const share = await paymentRepo.findShare(target.id)
  return share ? { rupees: share.amount, paymentId: share.paymentId, tripId: share.payment.tripId, driverId: share.payment.trip.driverId, riderId: null, payerEmail: share.email } : null
}

/*
  the one place money turns into paid, the checkout call and the webhook both end here
  every update is guarded by the pending status so the second one to arrive does nothing
*/
async function settle(target: Target, order: Paid, razorpayPaymentId: string) {
  const found = await lookup(target)
  if (!found) throw new AppError("Payment not found", 404)
  if (order.status !== "paid") return { paid: false, waiting: true }
  if (order.amount_paid < found.rupees * 100) throw new AppError("The paid amount does not match this payment", 409)
  if (target.kind === "payment") {
    const done = await paymentRepo.settleOnline(target.id, razorpayPaymentId)
    if (done.count) await notify(found.driverId, "PAYMENT", "Payment received", "The rider paid online", { tripId: found.tripId })
    return { paid: true, waiting: false, already: !done.count }
  }
  const result = await paymentRepo.settleShare(target.id, found.paymentId)
  if (result?.complete) await notify(found.driverId, "PAYMENT", "Payment received", "The riders paid in full", { tripId: found.tripId })
  return { paid: true, waiting: false, already: !result }
}

export async function verifyCheckout(userId: string, { orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) {
  if (!checkoutSignatureOk(orderId, paymentId, signature)) throw new AppError("The payment signature does not match", 400)
  const order = await fetchOrder(orderId)
  const target = targetOf(order.notes)
  if (!target) throw new AppError("This order does not belong to DaiGo", 400)
  const [found, user] = await Promise.all([lookup(target), userRepo.getById(userId)])
  const mine = found && (target.kind === "payment" ? found.riderId === userId : found.payerEmail === user.email.toLowerCase())
  if (!mine) throw new AppError("Payment not found", 404)
  return settle(target, order, paymentId)
}

async function payerOf(target: Target) {
  const found = await lookup(target)
  if (!found) return null
  if (found.riderId) return found.riderId
  const user = found.payerEmail ? await userRepo.findByEmail(found.payerEmail) : null
  return user?.id ?? null
}

/*
  razorpay retries a webhook until it gets a 200, so unknown or repeated events are answered with a 200 too
  the event id is written only after the work worked, a crash in the middle means a retry does it again
*/
export async function handleWebhook(raw: string, signature: string | null, eventId: string | null) {
  if (!signature || !webhookSignatureOk(raw, signature)) throw new AppError("Invalid webhook signature", 400)
  const seen = eventId ? await redis.get(`rzp:event:${eventId}`) : null
  if (seen) return { handled: false, duplicate: true }
  const parsed = eventSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) return { handled: false }
  const { event, payload } = parsed.data
  const paymentId = payload.payment?.entity.id ?? ""
  const order = payload.order?.entity
  if (event === "order.paid" && order) {
    const target = targetOf(order.notes)
    if (!target) return { handled: false }
    await settle(target, order, paymentId)
  } else if (event === "payment.failed" && payload.payment?.entity.order_id) {
    const target = targetOf((await fetchOrder(payload.payment.entity.order_id)).notes)
    const payer = target ? await payerOf(target) : null
    if (payer) await notify(payer, "PAYMENT", "Payment failed", "Your payment did not go through. You can try again from the trip.", { failed: true })
  } else return { handled: false }
  if (eventId) await redis.set(`rzp:event:${eventId}`, "1", { ex: eventSeconds })
  return { handled: true }
}

const staleMs = 15 * 60 * 1000
const lookBackMs = 2 * 24 * 60 * 60 * 1000
const flagSeconds = 7 * 24 * 60 * 60

/*
  the safety net behind the webhook, it runs every 15 minutes
  an online payment still pending after 15 minutes is asked about at razorpay, a paid one is settled
  a payment we show as paid that razorpay says is refunded or failed is reported to the super admins, once
  split shares keep no order id, so those depend on the webhook alone
*/
export async function reconcilePayments() {
  if (!razorpayOn) return { checked: 0, settled: 0, flagged: 0 }
  const [stale, recent] = await Promise.all([paymentRepo.stalePendingOnline(new Date(Date.now() - staleMs)), paymentRepo.recentPaidOnline(new Date(Date.now() - lookBackMs))])
  let settled = 0
  let flagged = 0
  for (const payment of stale) {
    const order = await fetchOrder(payment.gatewayRef ?? "")
    if (order.status !== "paid") continue
    const taken = (await fetchOrderPayments(order.id)).items.find((item) => item.status === "captured")
    const done = await settle({ kind: "payment", id: payment.id }, order, taken?.id ?? order.id)
    if (done.paid && !done.already) settled++
  }
  for (const payment of recent) {
    const live = await fetchPayment(payment.gatewayRef ?? "")
    if (live.status === "captured" || live.status === "authorized") continue
    const first = await redis.set(`rzp:flag:${payment.id}`, "1", { nx: true, ex: flagSeconds })
    if (!first) continue
    flagged++
    const admins = await userRepo.superAdmins()
    await Promise.all(admins.map((admin) => notify(admin.id, "PAYMENT", "Payment mismatch", `Payment ${payment.id} is paid here but ${live.status} at Razorpay.`, { paymentId: payment.id })))
  }
  return { checked: stale.length + recent.length, settled, flagged }
}
