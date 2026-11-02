import { cabRate, moneySaved } from "@/lib/infra/economy/savings"
import * as ratingRepo from "@/lib/repository/trip/rating-repo"
import * as tripRepo from "@/lib/repository/trip/trip-repo"

export async function riderDashboard(riderId: string) {
  const [completed, recent, active, cab] = await Promise.all([tripRepo.completedForRider(riderId), tripRepo.recentForRider(riderId), tripRepo.activeForRider(riderId), cabRate()])
  const totalSpent = completed.reduce((sum, t) => sum + t.priceEstimate, 0)
  const savedEach = completed.map((t) => moneySaved(t.distanceKm, t.priceEstimate, cab))
  const saved = savedEach.reduce((sum, n) => sum + n, 0)
  return { completedTrips: completed.length, totalSpent, moneySaved: saved, activeTrip: active, recentTrips: recent }
}

export async function driverDashboard(driverId: string) {
  const [completed, ratings, recentRatings, upcoming] = await Promise.all([
    tripRepo.completedSummaryForDriver(driverId),
    ratingRepo.summaryFor(driverId),
    ratingRepo.recentFor(driverId),
    tripRepo.upcomingCountForDriver(driverId),
  ])
  const rating = { average: ratings._avg.score, count: ratings._count._all, recent: recentRatings }
  return { completedTrips: completed._count._all, totalEarned: completed._sum.priceEstimate ?? 0, upcomingTrips: upcoming, rating }
}
