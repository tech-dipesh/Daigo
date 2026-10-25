import { db } from "@/lib/infra/clients/db"

export const listByMatch = (matchId: string) => db.offer.findMany({ where: { matchId }, orderBy: { round: "asc" } })

/* a new offer keeps the request alive for the same window */
export const createAndExtend = (data: { matchId: string; rideRequestId: string; round: number; by: "RIDER" | "DRIVER"; price: number; expiresAt: Date }) =>
  db.$transaction(async (tx) => {
    const { rideRequestId, ...offer } = data
    const created = await tx.offer.create({ data: offer })
    await tx.rideRequest.update({ where: { id: rideRequestId }, data: { expiresAt: data.expiresAt } })
    return created
  })
