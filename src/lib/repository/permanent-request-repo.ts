import { db } from "@/lib/infra/clients/db"

export const findActiveOwned = (id: string, riderId: string) => db.permanentRideRequest.findFirst({ where: { id, riderId, isActive: true } })
