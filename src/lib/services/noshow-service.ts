import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { noShowReasonBonus, noShowReasonHours, noShowWaitMinutes } from "@/lib/infra/economy/trip-rules"
import { relayLatePenalty } from "@/lib/infra/economy/trust"
import { publishEvent } from "@/lib/infra/realtime/publish"
import { notify } from "@/lib/infra/realtime/notify"
import * as tripRepo from "@/lib/repository/trip-repo"
import * as userRepo from "@/lib/repository/user-repo"
import type { NoShowReasonInput } from "@/lib/validation/trip-schema"
import { asDriver } from "@/lib/services/trip-guards"
import { forViewer } from "@/lib/services/trip-view"

export async function markNoShow(driverId: string, id: string) {
  const trip = await asDriver(id, driverId, "Only the driver can report a no-show")
  if (!trip.arrivedAt) throw new AppError("Mark yourself as arrived first", 409)
  const remainingMs = trip.arrivedAt.getTime() + noShowWaitMinutes * 60000 - Date.now()
  if (remainingMs > 0) throw new AppError(`Wait ${Math.ceil(remainingMs / 1000)} more seconds before marking a no-show`, 409)
  const updated = await tripRepo.markNoShow(trip)
  if (!updated) throw new AppError("This trip is not waiting for pickup", 409)
  await publishEvent(trip.riderId, "trip.status", { tripId: id, status: updated.status })
  await notify(trip.riderId, "TRIP_STATUS", "Marked as no-show", "Your driver waited and could not find you. Retry your request any time", { tripId: id })
  return forViewer(updated, driverId)
}

export async function explainNoShow(riderId: string, id: string, { reason }: NoShowReasonInput) {
  const trip = await getTripForUser(id, riderId)
  if (trip.riderId !== riderId) throw new AppError("Only the rider can explain a no-show", 403)
  if (trip.status !== "NO_SHOW" || trip.noShowReason) throw new AppError("There is nothing to explain on this trip", 409)
  if (Date.now() - trip.updatedAt.getTime() > noShowReasonHours * 60 * 60 * 1000) throw new AppError("The time to explain this no-show is over", 409)
  const saved = await tripRepo.saveNoShowReason(id, riderId, reason, noShowReasonBonus)
  return forViewer(saved, riderId)
}

export async function reportFirstLegLate(driverId: string, id: string) {
  const trip = await asDriver(id, driverId, "Only the driver can report this")
  if (trip.relayLeg !== "SECOND") throw new AppError("Only the second leg can report the first as late", 400)
  const firstLegTrip = await tripRepo.findRelayLeg(trip.relayMatchId, "FIRST")
  if (!firstLegTrip) throw new AppError("First leg trip not found", 404)
  if (firstLegTrip.status !== "PENDING_PICKUP") {
    throw new AppError("The first leg has already moved past pickup", 409)
  }
  await userRepo.adjustTrustNow(firstLegTrip.driverId, -relayLatePenalty)
  // second river can cancel if he want
  return { firstLegTripId: firstLegTrip.id, penaltyApplied: relayLatePenalty }
}
