import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"
import { coinsRequiredToRedeem } from "@/lib/infra/economy/coins"

type NewPayment = { tripId: string; amount: number; method: "ONLINE" | "CASH"; status: "PENDING" | "PAID"; gatewayRef: string | null; coinsRedeemed: number; paidAt: Date | null }

export const findByTrip = (tripId: string) => db.payment.findUnique({ where: { tripId } })
export const markPaid = (id: string, proofPhotoUrl: string) => db.payment.update({ where: { id }, data: { status: "PAID", proofPhotoUrl, paidAt: new Date() } })

/* coins leave the wallet in the same transaction as the payment is made */
export const createRedeeming = (data: NewPayment, userId: string) =>
  db.$transaction(async (tx) => {
    if (data.coinsRedeemed > 0) {
      const taken = await tx.user.updateMany({ where: { id: userId, coinBalance: { gte: coinsRequiredToRedeem } }, data: { coinBalance: { decrement: data.coinsRedeemed } } })
      if (!taken.count) throw new AppError("You don't have enough coins to redeem", 409)
      await tx.coinTransaction.create({ data: { userId, amount: -data.coinsRedeemed, reason: "redeemed on trip payment" } })
    }
    return tx.payment.create({ data })
  })
