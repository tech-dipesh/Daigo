import { AppError } from "@/lib/infra/http/response"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { expiryFromNow, isExpired } from "@/lib/infra/matching/expiry"
import { generatePermanentRequest } from "@/lib/infra/matching/permanent"
import { waitlistHours } from "@/lib/infra/matching/waitlist"
import * as permanentRequestRepo from "@/lib/repository/permanent-request-repo"
import * as ratingRepo from "@/lib/repository/rating-repo"
import * as rideRequestRepo from "@/lib/repository/ride-request-repo"
import * as userRepo from "@/lib/repository/user-repo"
import * as waitlistRepo from "@/lib/repository/waitlist-repo"
import type { PriceEstimateQueryInput, RideRequestInput } from "@/lib/validation/request-schema"

export const listRequests = (riderId: string) => rideRequestRepo.listByRider(riderId)

export const listWaitlist = (riderId: string) => waitlistRepo.listActive(riderId)

export async function createRequest(riderId: string, { passenger, forEmail, ...data }: RideRequestInput) {
  await requireMember(riderId)
  const user = await userRepo.findById(riderId)
  if (user?.activeRole !== "RIDER") {
    throw new AppError("Switch to rider mode to post a request", 403)
  }
  if (passenger && forEmail) throw new AppError("Book for a child or for another adult, not both", 400)
  if (data.windowEnd <= data.windowStart) {
    throw new AppError("The time window end must be after the start", 400)
  }
  const duplicateRequest = await rideRequestRepo.findDuplicate(riderId, data)
  if (duplicateRequest) {
    throw new AppError("You already have an active request for this trip", 409)
  }
  const minor = passenger ? { minorName: passenger.name, minorAge: passenger.age, isVulnerable: true } : {}
  return rideRequestRepo.create({ ...data, ...minor, passengerEmail: forEmail, riderId, expiresAt: expiryFromNow() })
}

async function findLapsed(riderId: string, id: string, action: string) {
  const old = await rideRequestRepo.findOwned(id, riderId)
  if (!old) throw new AppError("Ride request not found", 404)
  const lapsed = old.status === "EXPIRED" || (old.status === "PENDING" && isExpired(old.expiresAt))
  if (!lapsed) throw new AppError(`Only an expired request can ${action}`, 409)
  return old
}

export async function retryRequest(riderId: string, id: string) {
  await requireMember(riderId)
  const old = await findLapsed(riderId, id, "be retried")
  const length = old.windowEnd.getTime() - old.windowStart.getTime()
  const windowStart = new Date(Math.max(old.windowStart.getTime(), Date.now()))
  const windowEnd = new Date(windowStart.getTime() + length)
  return rideRequestRepo.replaceWithCopy(old, windowStart, windowEnd, expiryFromNow())
}

export async function joinWaitlist(riderId: string, id: string) {
  await requireMember(riderId)
  await findLapsed(riderId, id, "join the waitlist")
  const current = await waitlistRepo.findByRequest(id)
  if (current?.status === "WAITING" && current.expiresAt > new Date()) throw new AppError("This request is already on the waitlist", 409)
  return waitlistRepo.join(id, riderId, new Date(Date.now() + waitlistHours * 60 * 60 * 1000))
}

export async function leaveWaitlist(riderId: string, id: string) {
  const { count } = await waitlistRepo.cancel(id, riderId)
  if (!count) throw new AppError("This request is not on the waitlist", 404)
  return { cancelled: true }
}

export async function suggestedDrivers(riderId: string) {
  const goodRatings = await ratingRepo.goodRatingsBy(riderId)
  const ratedDrivers = goodRatings.map((rating) => rating.ratedUser)
  const seen = new Set<string>()
  return ratedDrivers.filter((driver) => (seen.has(driver.id) ? false : seen.add(driver.id)))
}

/*
  the first preference will always be the prefer driver it even open to public
  fix window time to give 75 second reject/accept
  with a prefrerence routes for the route
*/
export async function generateToday(riderId: string, id: string) {
  const template = await permanentRequestRepo.findActiveOwned(id, riderId)
  if (!template) throw new AppError("Permanent request not found or cancelled", 404)
  if (!template.daysOfWeek.includes(new Date().getUTCDay())) throw new AppError("This permanent request doesn't run today", 400)
  return generatePermanentRequest(template)
}

export async function priceEstimate({ when, groupSize, minor, ...points }: PriceEstimateQueryInput) {
  const pricing = await buildPricing({ ...points, groupSize, minor: minor === "true", when: when ?? new Date() })
  const types = groupSize > 1 ? ["AUTO", "CAR", "CAB"] : ["BIKE", "SCOOTER", "AUTO", "CAR", "CAB"]
  const quotes = types.map((type) => pricing.quote(type))
  return { distanceKm: pricing.distanceKm, minutes: pricing.minutes, zones: pricing.zones, quotes }
}
