import { db } from "@/lib/infra/clients/db"

type Changes = { name?: string; phone?: string; email?: string | null; isPrimary?: boolean }

export const findOwned = (id: string, userId: string) => db.emergencyContact.findFirst({ where: { id, userId } })
export const countFor = (userId: string) => db.emergencyContact.count({ where: { userId } })

export const update = (id: string, userId: string, data: Changes) =>
  db.$transaction(async (tx) => {
    if (data.isPrimary) await tx.emergencyContact.updateMany({ where: { userId, id: { not: id } }, data: { isPrimary: false } })
    return tx.emergencyContact.update({ where: { id }, data })
  })

export const remove = (id: string, userId: string, wasPrimary: boolean) =>
  db.$transaction(async (tx) => {
    await tx.emergencyContact.delete({ where: { id } })
    if (!wasPrimary) return
    const next = await tx.emergencyContact.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } })
    if (next) await tx.emergencyContact.update({ where: { id: next.id }, data: { isPrimary: true } })
  })
