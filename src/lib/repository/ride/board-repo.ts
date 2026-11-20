import { db } from "@/lib/infra/clients/db"

export const boardMatches = (rideRequestId: string, riderId: string) =>
  db.match.findMany({
    where: { rideRequestId, status: "PENDING", rideRequest: { riderId } },
    include: { route: { include: { vehicle: true, driver: { select: { name: true, trustScore: true, profilePhotoUrl: true } } } }, offers: { orderBy: { round: "desc" }, take: 1 } },
    orderBy: { priceEstimate: "asc" },
  })

export const ratingsFor = (ids: string[]) => db.rating.groupBy({ by: ["ratedUserId"], where: { ratedUserId: { in: ids } }, _avg: { score: true }, _count: { _all: true } })
