import { db } from "@/lib/infra/clients/db"

export const cancelPending = (id: string, riderId: string) =>
  db.$transaction(async (tx) => {
    const done = await tx.rideRequest.updateMany({ where: { id, riderId, status: "PENDING" }, data: { status: "CANCELLED" } })
    if (done.count) await tx.match.updateMany({ where: { rideRequestId: id, status: "PENDING" }, data: { status: "EXPIRED" } })
    return done.count
  })
