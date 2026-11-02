import { randomBytes } from "node:crypto"
import { AppError } from "@/lib/infra/http/response"
import { getTripForUser } from "@/lib/infra/auth/trip-access"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { env } from "@/lib/infra/clients/env"
import { etaMinutes } from "@/lib/infra/matching/eta"
import { distanceKm } from "@/lib/infra/matching/geo"
import * as tripRepo from "@/lib/repository/trip/trip-repo"
import type { ShareInput } from "@/lib/validation/trip/trip-schema"

const linkLifeAfterTripMs = 2 * 60 * 60 * 1000

export async function shareTrip(userId: string, id: string, { emails }: ShareInput) {
  const trip = await getTripForUser(id, userId)
  const shareToken = trip.shareToken ?? randomBytes(16).toString("hex")
  if (!trip.shareToken) await tripRepo.setShareToken(trip.id, shareToken)
  const link = `${env.APP_URL}/api/v1/trips/shared/${shareToken}`
  for (const to of emails) {
    await sendEmailBestEffort({ to, subject: "Follow a DaiGo ride live", text: `Someone shared their ride with you. Follow it live here: ${link}` })
  }
  return { shareToken, link, sentTo: emails.length }
}

export async function stopSharing(userId: string, id: string) {
  const trip = await getTripForUser(id, userId)
  await tripRepo.setShareToken(trip.id, null)
  return { stopped: true }
}

/*
  public view, so it shows the least it can
  no names, emails or plate, only status, vehicle model, position and eta
  link dies 2 hours after the trip ends
*/
export async function sharedView(token: string) {
  const trip = await tripRepo.findBySharedToken(token)
  if (!trip) throw new AppError("This share link isn't valid", 404)
  const running = trip.status === "PENDING_PICKUP" || trip.status === "IN_PROGRESS"
  const justEnded = trip.status === "COMPLETED" && trip.completedAt !== null && Date.now() - trip.completedAt.getTime() < linkLifeAfterTripMs
  if (!running && !justEnded) throw new AppError("This share link has ended", 410)
  const target = trip.status === "PENDING_PICKUP" ? { lat: trip.rideRequest.fromLat, lng: trip.rideRequest.fromLng } : { lat: trip.route.toLat, lng: trip.route.toLng }
  const remainingKm = trip.lastLat !== null && trip.lastLng !== null ? distanceKm(trip.lastLat, trip.lastLng, target.lat, target.lng) : null
  return {
    status: trip.status,
    vehicle: `${trip.route.vehicle.make} ${trip.route.vehicle.model}`,
    lastLat: trip.lastLat,
    lastLng: trip.lastLng,
    lastLocationAt: trip.lastLocationAt,
    isDeviated: trip.isDeviated,
    etaMinutes: remainingKm === null ? null : etaMinutes(remainingKm),
  }
}
