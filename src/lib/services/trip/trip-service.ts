import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { cancellationGamingThreshold, cancellationWindowHours } from "@/lib/infra/economy/abuse"
import { pingIsFresh } from "@/lib/infra/economy/minor"
import { cabRate, moneySaved } from "@/lib/infra/economy/savings"
import { cancellationPenalty } from "@/lib/infra/economy/trust"
import { issueWarning } from "@/lib/infra/economy/warnings"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import * as rideRequestRepo from "@/lib/repository/ride/ride-request-repo"
import * as tripRepo from "@/lib/repository/trip/trip-repo"
import type { CancelInput, VerifyPickupInput } from "@/lib/validation/trip/trip-schema"
import { asDriver } from "@/lib/services/trip/trip-guards"
import { forViewer } from "@/lib/services/trip/trip-view"

export async function listTrips(userId: string) {
  const trips = await tripRepo.listForUser(userId)
  return trips.map((trip) => forViewer(trip, userId))
}

export async function getTrip(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  return forViewer(trip, userId)
}

export async function markArrived(driverId: string, id: string) {
  const trip = await asDriver(id, driverId, "Only the driver can mark arrival")
  if (trip.status !== "PENDING_PICKUP") throw new AppError("This trip is not waiting for pickup", 409)
  if (trip.arrivedAt) return forViewer(trip, driverId)
  const updated = await tripRepo.markArrived(id)
  await Promise.all([publishEvent(trip.riderId, "trip.status", { tripId: id, status: updated.status, arrivedAt: updated.arrivedAt }), notify(trip.riderId, "TRIP_STATUS", "Driver arrived", "Your driver is at the pickup point, share your pickup code", { tripId: id })])
  return forViewer(updated, driverId)
}

export async function verifyPickup(driverId: string, id: string, { otp }: VerifyPickupInput) {
  const trip = await asDriver(id, driverId, "Only the driver can verify pickup")
  if (trip.status !== "PENDING_PICKUP") {
    throw new AppError("This trip is not waiting for pickup", 409)
  }
  if (otp !== trip.pickupOtp) {
    throw new AppError("Incorrect pickup code", 400)
  }
  const minorAge = await rideRequestRepo.minorAgeOf(trip.rideRequestId)
  if (minorAge !== null && !pingIsFresh(trip.lastLocationAt)) throw new AppError("Share your live location before picking up a child", 409)
  const updated = await tripRepo.startTrip(trip.id)
  await Promise.all([publishEvent(trip.riderId, "trip.status", { tripId: trip.id, status: updated.status }), notify(trip.riderId, "TRIP_STATUS", "Trip started", "Your pickup was verified and the trip has started", { tripId: trip.id })])
  return forViewer(updated, driverId)
}

export async function completeTrip(driverId: string, id: string) {
  const trip = await asDriver(id, driverId, "Only the driver can complete this trip")
  if (trip.status !== "IN_PROGRESS") {
    throw new AppError("This trip is not in progress", 409)
  }
  const updated = await tripRepo.completeWithCoins(trip)
  const [, , cab] = await Promise.all([publishEvent(trip.riderId, "trip.status", { tripId: trip.id, status: updated.status }), notify(trip.riderId, "TRIP_STATUS", "Trip completed", "Your trip is complete, please rate your driver", { tripId: trip.id }), cabRate()])
  const saved = moneySaved(trip.distanceKm, trip.priceEstimate, cab)
  if (saved > 0) await notify(trip.riderId, "SAVINGS", "You saved money", `You saved ${saved} rupees compared to a solo cab`, { tripId: trip.id, saved })
  return forViewer(updated, driverId)
}

export async function cancelTrip(userId: string, id: string, { reason }: CancelInput) {
  const trip = await getTripForUser(id, userId)
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED" || trip.status === "NO_SHOW") {
    throw new AppError("This trip can no longer be cancelled", 409)
  }
  const cancelledBy = trip.riderId === userId ? "RIDER" : "DRIVER"
  const windowStart = new Date(Date.now() - cancellationWindowHours * 60 * 60 * 1000)
  const recentCancellations = await tripRepo.countRecentCancellations(userId, cancelledBy, windowStart)
  // repeated rapid cancelling is suspicious on its own - the early-cancel grace
  // period only makes sense for someone cancelling occasionally, not gaming it
  const isGaming = recentCancellations >= cancellationGamingThreshold
  const minutesSinceCommit = isGaming ? Number.POSITIVE_INFINITY : (Date.now() - trip.createdAt.getTime()) / 60000
  const penalty = cancellationPenalty(cancelledBy, minutesSinceCommit)
  const updated = await tripRepo.cancelAndRelease(trip, userId, cancelledBy, reason, penalty)
  if (isGaming) await issueWarning(userId, "CANCEL_GAMING", "Too many cancellations in a short time", trip.id)
  const other = cancelledBy === "RIDER" ? trip.driverId : trip.riderId
  await Promise.all([publishEvent(other, "trip.status", { tripId: trip.id, status: updated.status }), notify(other, "TRIP_STATUS", "Trip cancelled", "The other person cancelled this trip", { tripId: trip.id })])
  return forViewer(updated, userId)
}
