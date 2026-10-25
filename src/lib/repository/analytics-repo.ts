import { db } from "@/lib/infra/clients/db"

export const platformCounts = () =>
  Promise.all([
    db.user.count(),
    db.trip.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { _all: true } }),
  ])

export const windowSnapshot = (since: Date) =>
  Promise.all([
    db.trip.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } }),
    db.emergencyEvent.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.trip.findMany({ where: { status: "COMPLETED", completedAt: { gte: since } }, select: { priceEstimate: true, distanceKm: true } }),
    db.trip.groupBy({ by: ["driverId"], where: { createdAt: { gte: since } } }),
    db.payment.aggregate({ where: { createdAt: { gte: since }, coinsRedeemed: { gt: 0 } }, _count: { _all: true }, _sum: { coinsRedeemed: true } }),
  ])
