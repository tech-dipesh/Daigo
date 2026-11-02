import { countByDay } from "@/lib/infra/economy/analytics"
import { cabRate, moneySaved } from "@/lib/infra/economy/savings"
import * as analyticsRepo from "@/lib/repository/admin/analytics-repo"

export async function getAnalytics(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const [[trips, emergencies, completed, drivers, redemptions], cab] = await Promise.all([analyticsRepo.windowSnapshot(since), cabRate()])
  const cancelled = trips.filter((t) => t.status === "CANCELLED")
  const savedEach = completed.map((t) => moneySaved(t.distanceKm, t.priceEstimate, cab))
  return {
    days,
    tripsByDay: countByDay(trips.map((t) => t.createdAt)),
    emergenciesByDay: countByDay(emergencies.map((e) => e.createdAt)),
    totalTrips: trips.length,
    cancellationRate: trips.length ? Number((cancelled.length / trips.length).toFixed(3)) : 0,
    moneySaved: savedEach.reduce((sum, n) => sum + n, 0),
    activeDrivers: drivers.length,
    coinRedemptions: { count: redemptions._count._all, coins: redemptions._sum.coinsRedeemed ?? 0 },
  }
}
