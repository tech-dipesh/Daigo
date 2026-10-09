import { db } from "@/lib/infra/db"

type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

export const tripCompletionCoins = 10
export const coinsRequiredToRedeem = 500
export const redemptionDiscountRupees = 50

export async function awardCoins(tx: TransactionClient, userId: string, amount: number, reason: string) {
  await tx.coinTransaction.create({ data: { userId, amount, reason } })
  await tx.user.update({ where: { id: userId }, data: { coinBalance: { increment: amount } } })
}
