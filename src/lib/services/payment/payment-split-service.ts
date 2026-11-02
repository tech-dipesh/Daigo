import { AppError } from "@/lib/infra/http/response"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { notify } from "@/lib/infra/realtime/notify"
import * as paymentRepo from "@/lib/repository/payment/payment-repo"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"
import * as userRepo from "@/lib/repository/account/user-repo"
import type { NewShare } from "@/lib/repository/payment/payment-repo"

const payWindowMs = 24 * 60 * 60 * 1000

/*
  equal split, the booker takes the leftover rupees
  the booker pays their own share right away, others get 24 hours
*/
export async function planShares(rideRequestId: string, bookerEmail: string, total: number, splitWith: string[], online: boolean): Promise<NewShare[]> {
  if (!splitWith.length) return []
  if (!online) throw new AppError("Splitting a payment needs online payment", 400)
  const booker = bookerEmail.toLowerCase()
  const others = [...new Set(splitWith.map((email) => email.toLowerCase()))].filter((email) => email !== booker)
  if (!others.length) return []
  const groupSize = await rideRequestRepo.groupSizeOf(rideRequestId)
  if (others.length > groupSize - 1) throw new AppError("You can only split with the other riders in your group", 400)
  const each = Math.floor(total / (others.length + 1))
  const now = new Date()
  const own: NewShare = { email: booker, amount: total - each * others.length, status: "PAID", paidAt: now, expiresAt: now }
  const invited = others.map((email): NewShare => ({ email, amount: each, status: "PENDING", paidAt: null, expiresAt: new Date(Date.now() + payWindowMs) }))
  return [own, ...invited]
}

export async function inviteShares(tripId: string, bookerEmail: string) {
  const payment = await paymentRepo.findByTrip(tripId)
  const pending = payment?.shares.filter((share) => share.status === "PENDING") ?? []
  const invites = pending.map(async (share) => {
    const text = `${bookerEmail} split a DaiGo ride with you. Log in with this email and pay your share of ${share.amount} rupees within 24 hours.`
    const [user] = await Promise.all([userRepo.findByEmail(share.email), sendEmailBestEffort({ to: share.email, subject: "Your share of a DaiGo ride", text })])
    if (user) await notify(user.id, "PAYMENT", "Pay your share", `Your share of the ride is ${share.amount} rupees`, { shareId: share.id })
  })
  await Promise.all(invites)
}

export async function payShare(userId: string, shareId: string) {
  const user = await userRepo.getById(userId)
  const share = await paymentRepo.findShare(shareId)
  if (!share || share.email !== user.email.toLowerCase()) throw new AppError("Payment share not found", 404)
  if (!user.emailVerifiedAt) throw new AppError("Please verify your email before doing this", 403)
  if (share.status === "PAID") throw new AppError("This share is already paid", 409)
  const result = await paymentRepo.settleShare(share.id, share.paymentId)
  if (!result) throw new AppError("This share is already paid", 409)
  if (result.complete) await notify(share.payment.trip.driverId, "PAYMENT", "Payment received", "The riders paid in full", { tripId: share.payment.tripId })
  return { paid: true, paymentComplete: result.complete }
}
