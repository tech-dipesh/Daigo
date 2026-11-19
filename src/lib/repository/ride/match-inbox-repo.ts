import { db } from "@/lib/infra/clients/db"

export const pendingForDriver = (driverId: string) =>
  db.match.findMany({
    where: { status: "PENDING", route: { driverId }, rideRequest: { status: "PENDING", expiresAt: { gt: new Date() } } },
    include: { rideRequest: true, route: true },
    orderBy: { createdAt: "desc" },
  })
