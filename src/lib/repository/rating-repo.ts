import { db } from "@/lib/infra/clients/db"
import * as userRepo from "@/lib/repository/user-repo"

export const goodRatingsBy = (raterId: string) =>
  db.rating.findMany({
    where: { raterId, score: { gte: 4 } },
    include: { ratedUser: { select: { id: true, email: true, trustScore: true } } },
    orderBy: { score: "desc" },
  })

export const findByTripAndRater = (tripId: string, raterId: string) => db.rating.findUnique({ where: { tripId_raterId: { tripId, raterId } } })
export const countForTrip = (tripId: string) => db.rating.count({ where: { tripId } })

export const createWithTrust = (data: Parameters<typeof db.rating.create>[0]["data"], ratedUserId: string, delta: number) =>
  db.$transaction(async (tx) => {
    const created = await tx.rating.create({ data })
    await userRepo.adjustTrust(tx, ratedUserId, delta)
    return created
  })

export const summaryFor = (ratedUserId: string) => db.rating.aggregate({ where: { ratedUserId }, _avg: { score: true }, _count: { _all: true } })
export const recentFor = (ratedUserId: string) => db.rating.findMany({ where: { ratedUserId }, orderBy: { createdAt: "desc" }, take: 10, select: { score: true, createdAt: true } })
