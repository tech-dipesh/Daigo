import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { countByDay } from "@/lib/infra/economy/analytics"
import { cabRate, moneySaved } from "@/lib/infra/economy/savings"
import { analyticsQuerySchema } from "@/lib/validation/admin-schema"

export const GET = withErrorHandling(async (request) => {
  await requireStaff(request)
  const { days } = analyticsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const [trips, emergencies, completed, drivers, redemptions, cab] = await Promise.all([
    db.trip.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } }),
    db.emergencyEvent.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.trip.findMany({ where: { status: "COMPLETED", completedAt: { gte: since } }, select: { priceEstimate: true, distanceKm: true } }),
    db.trip.groupBy({ by: ["driverId"], where: { createdAt: { gte: since } } }),
    db.payment.aggregate({ where: { createdAt: { gte: since }, coinsRedeemed: { gt: 0 } }, _count: { _all: true }, _sum: { coinsRedeemed: true } }),
    cabRate(),
  ])
  const cancelled = trips.filter((t) => t.status === "CANCELLED")
  const savedEach = completed.map((t) => moneySaved(t.distanceKm, t.priceEstimate, cab))
  return successResponse({
    days,
    tripsByDay: countByDay(trips.map((t) => t.createdAt)),
    emergenciesByDay: countByDay(emergencies.map((e) => e.createdAt)),
    totalTrips: trips.length,
    cancellationRate: trips.length ? Number((cancelled.length / trips.length).toFixed(3)) : 0,
    moneySaved: savedEach.reduce((sum, n) => sum + n, 0),
    activeDrivers: drivers.length,
    coinRedemptions: { count: redemptions._count._all, coins: redemptions._sum.coinsRedeemed ?? 0 },
  })
})
