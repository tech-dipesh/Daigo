import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"
import { startOfIstDay } from "@/lib/infra/economy/warnings"
import { distanceKm } from "@/lib/infra/matching/geo"

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]
type Incoming = { fromLat: number; fromLng: number; windowStart: Date; windowEnd: Date; allowShared: boolean }

const handoffKm = 4
const maxDriveHours = 15
const activeStatuses = ["PENDING_PICKUP", "IN_PROGRESS"] as const

/*
  checked inside the accept tx but two accepts at the exact same
  moment can still slip past, fine for now, ill look at it later
*/
export async function assertCanAccept(tx: Tx, driverId: string, routeId: string, incoming: Incoming) {
  const active = await tx.trip.findMany({ where: { driverId, status: { in: [...activeStatuses] } }, include: { rideRequest: true } })
  const sameRoute = active.filter((t) => t.routeId === routeId)
  const blocksSharing = sameRoute.some((t) => !t.rideRequest.allowShared)
  if (sameRoute.length && (!incoming.allowShared || blocksSharing)) throw new AppError("This vehicle already has a rider who did not allow sharing", 409)
  const otherRoutes = active.filter((t) => t.routeId !== routeId)
  const overlapping = otherRoutes.filter((t) => t.rideRequest.windowStart < incoming.windowEnd && t.rideRequest.windowEnd > incoming.windowStart)
  const clash = overlapping.find((t) => distanceKm(t.rideRequest.toLat, t.rideRequest.toLng, incoming.fromLat, incoming.fromLng) > handoffKm)
  if (clash) throw new AppError("You already have a trip at that time", 409)
  const today = await tx.trip.findMany({ where: { driverId, otpVerifiedAt: { gte: startOfIstDay() } }, select: { otpVerifiedAt: true, completedAt: true } })
  const spans = today.map((t) => (t.completedAt ?? new Date()).getTime() - (t.otpVerifiedAt?.getTime() ?? 0))
  const hours = spans.reduce((sum, ms) => sum + ms, 0) / (1000 * 60 * 60)
  if (hours >= maxDriveHours) throw new AppError("You hit the 15 hour driving limit for today", 409)
}
