import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"
import { coinsRequiredToRedeem } from "@/lib/infra/economy/coins"

type NewPayment = { tripId: string; amount: number; method: "ONLINE" | "CASH"; status: "PENDING" | "PAID"; gatewayRef: string | null; coinsRedeemed: number; paidAt: Date | null }
export type NewShare = { email: string; amount: number; status: "PENDING" | "PAID"; paidAt: Date | null; expiresAt: Date }

export const findByTrip = (tripId: string) => db.payment.findUnique({ where: { tripId }, include: { shares: true } })
export const markPaid = (id: string, proofPhotoUrl: string) => db.payment.update({ where: { id }, data: { status: "PAID", proofPhotoUrl, paidAt: new Date() } })
export const findById = (id: string) => db.payment.findUnique({ where: { id }, include: { trip: true } })
export const setGatewayRef = (id: string, gatewayRef: string) => db.payment.updateMany({ where: { id, status: "PENDING" }, data: { gatewayRef } })

/* the where makes a second delivery of the same payment a no-op */
export const settleOnline = (id: string, gatewayRef: string) => db.payment.updateMany({ where: { id, status: "PENDING", method: "ONLINE" }, data: { status: "PAID", paidAt: new Date(), gatewayRef } })

export const stalePendingOnline = (before: Date) => db.payment.findMany({ where: { method: "ONLINE", status: "PENDING", gatewayRef: { startsWith: "order_" }, createdAt: { lt: before } }, take: 50 })
export const recentPaidOnline = (since: Date) => db.payment.findMany({ where: { method: "ONLINE", status: "PAID", gatewayRef: { startsWith: "pay_" }, paidAt: { gt: since } }, take: 50 })

export const findShare = (id: string) => db.paymentShare.findUnique({ where: { id }, include: { payment: { include: { trip: true } } } })

/* coins leave the wallet in the same transaction as the payment is made */
export const createRedeeming = (data: NewPayment, userId: string, shares: NewShare[] = []) =>
  db.$transaction(async (tx) => {
    if (data.coinsRedeemed > 0) {
      const taken = await tx.user.updateMany({ where: { id: userId, coinBalance: { gte: coinsRequiredToRedeem } }, data: { coinBalance: { decrement: data.coinsRedeemed } } })
      if (!taken.count) throw new AppError("You don't have enough coins to redeem", 409)
      await tx.coinTransaction.create({ data: { userId, amount: -data.coinsRedeemed, reason: "redeemed on trip payment" } })
    }
    const payment = await tx.payment.create({ data })
    if (shares.length) await tx.paymentShare.createMany({ data: shares.map((share) => ({ ...share, paymentId: payment.id })) })
    return payment
  })

/* last share paid closes the whole payment in the same transaction */
export const settleShare = (id: string, paymentId: string) =>
  db.$transaction(async (tx) => {
    const paid = await tx.paymentShare.updateMany({ where: { id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date() } })
    if (!paid.count) return null
    const left = await tx.paymentShare.count({ where: { paymentId, status: "PENDING" } })
    if (left > 0) return { complete: false }
    await tx.payment.update({ where: { id: paymentId }, data: { status: "PAID", paidAt: new Date(), gatewayRef: "split" } })
    return { complete: true }
  })
