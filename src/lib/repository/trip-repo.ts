import { db } from "@/lib/infra/clients/db"

export const countRecentCancellations = (userId: string, cancelledBy: "RIDER" | "DRIVER", since: Date) =>
  db.trip.count({ where: { cancelledBy, status: "CANCELLED", cancelledAt: { gte: since }, OR: [{ riderId: userId }, { driverId: userId }] } })

export const markArrived = (id: string) => db.trip.update({ where: { id }, data: { arrivedAt: new Date() } })

export const findRelayLeg = (relayMatchId: string | null, relayLeg: "FIRST" | "SECOND") => db.trip.findFirst({ where: { relayMatchId, relayLeg } })
