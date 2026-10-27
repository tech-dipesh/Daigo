import { randomUUID } from "node:crypto"
import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { coinsRequiredToRedeem, redemptionDiscountRupees } from "@/lib/infra/economy/coins"
import { notify } from "@/lib/infra/realtime/notify"
import { inviteShares, planShares } from "@/lib/services/payment-split-service"
import * as paymentRepo from "@/lib/repository/payment-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { PaymentConfirmInput, PaymentInput } from "@/lib/validation/trip-schema"

export async function payTrip(riderId: string, id: string, { method, redeemCoins, splitWith }: PaymentInput) {
  const trip = await getTripForUser(id, riderId)
  if (trip.riderId !== riderId) throw new AppError("Only the rider pays for a trip", 403)
  if (trip.status !== "COMPLETED") throw new AppError("You can pay once the trip is completed", 409)
  if (await paymentRepo.findByTrip(trip.id)) throw new AppError("This trip already has a payment", 409)
  const rider = await userRepo.getById(riderId)
  const discount = redeemCoins ? Math.min(redemptionDiscountRupees, trip.priceEstimate) : 0
  const total = trip.priceEstimate - discount
  const online = method === "ONLINE"
  const shares = await planShares(trip.rideRequestId, rider.email, total, splitWith, online)
  const paidNow = online && shares.length === 0
  const payment = await paymentRepo.createRedeeming(
    {
      tripId: trip.id,
      amount: total,
      method,
      status: paidNow ? "PAID" : "PENDING",
      gatewayRef: paidNow ? `mock_${randomUUID()}` : null,
      coinsRedeemed: redeemCoins ? coinsRequiredToRedeem : 0,
      paidAt: paidNow ? new Date() : null,
    },
    riderId,
    shares,
  )
  if (shares.length) await inviteShares(trip.id, rider.email)
  if (paidNow) await notify(trip.driverId, "PAYMENT", "Payment received", "The rider paid online", { tripId: trip.id })
  return payment
}

export async function getPayment(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  const payment = await paymentRepo.findByTrip(trip.id)
  if (!payment) throw new AppError("No payment has been started for this trip", 404)
  const now = new Date()
  return { ...payment, shares: payment.shares.map((share) => ({ ...share, overdue: share.status === "PENDING" && share.expiresAt < now })) }
}

export async function confirmCash(driverId: string, id: string, { proofPhotoUrl }: PaymentConfirmInput) {
  const trip = await getTripForUser(id, driverId)
  if (trip.driverId !== driverId) throw new AppError("Only the driver can confirm a cash payment", 403)
  const payment = await paymentRepo.findByTrip(trip.id)
  if (!payment) throw new AppError("No payment has been started for this trip", 404)
  if (payment.method !== "CASH") throw new AppError("Only cash payments need confirmation", 409)
  if (payment.status !== "PENDING") throw new AppError("This payment is already settled", 409)
  const paid = await paymentRepo.markPaid(payment.id, proofPhotoUrl)
  await notify(trip.riderId, "PAYMENT", "Payment confirmed", "The driver confirmed your cash payment", { tripId: trip.id })
  return paid
}
