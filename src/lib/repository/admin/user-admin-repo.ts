import { db } from "@/lib/infra/clients/db"

const pick = { id: true, email: true, name: true, activeRole: true, staffRole: true, trustScore: true, isBanned: true, emailVerifiedAt: true, createdAt: true } as const

export const search = (q: string | undefined, staffOnly: boolean) =>
  db.user.findMany({
    where: { deletedAt: null, ...(staffOnly ? { staffRole: { not: null } } : {}), ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}) },
    select: pick,
    orderBy: { createdAt: "desc" },
    take: 30,
  })

export const detail = async (id: string) => {
  const [user, trips, warnings, complaints] = await Promise.all([
    db.user.findFirst({ where: { id, deletedAt: null }, select: pick }),
    db.trip.count({ where: { OR: [{ riderId: id }, { driverId: id }] } }),
    db.warning.count({ where: { userId: id, revokedAt: null } }),
    db.complaint.count({ where: { againstId: id } }),
  ])
  return user ? { ...user, trips, warnings, complaints } : null
}
