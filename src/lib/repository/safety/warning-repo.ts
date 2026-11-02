import { db } from "@/lib/infra/clients/db"

export const findActiveOwned = (id: string, userId: string) => db.warning.findFirst({ where: { id, userId, revokedAt: null } })
