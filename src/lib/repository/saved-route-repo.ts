import { db } from "@/lib/infra/clients/db"

type NewSaved = Parameters<typeof db.savedRoute.create>[0]["data"]

export const list = (userId: string) => db.savedRoute.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
export const count = (userId: string) => db.savedRoute.count({ where: { userId } })
export const findOwned = (id: string, userId: string) => db.savedRoute.findFirst({ where: { id, userId } })
export const create = (data: NewSaved) => db.savedRoute.create({ data })
export const remove = (id: string, userId: string) => db.savedRoute.deleteMany({ where: { id, userId } })
