import { db } from "@/lib/infra/clients/db"

export const minorMaxAge = 13
export const minorMinTrust = 90
export const minorMinTrips = 10
export const minorPremium = 1.15
const minorPingMs = 5 * 60 * 1000

export const pingIsFresh = (lastLocationAt: Date | null) => lastLocationAt !== null && Date.now() - lastLocationAt.getTime() < minorPingMs

export async function minorSafeRoutes<R extends { driverId: string; driver: { trustScore: number } }>(routes: R[]) {
  const counts = await db.trip.groupBy({ by: ["driverId"], where: { driverId: { in: routes.map((r) => r.driverId) }, status: "COMPLETED" }, _count: { _all: true } })
  const completed = new Map(counts.map((c) => [c.driverId, c._count._all]))
  return routes.filter((r) => r.driver.trustScore >= minorMinTrust && (completed.get(r.driverId) ?? 0) >= minorMinTrips)
}
