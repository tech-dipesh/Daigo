import { db } from "@/lib/infra/clients/db"

export const findByRequest = (requestId: string) => db.waitlist.findUnique({ where: { requestId } })
export const listActive = (riderId: string) => db.waitlist.findMany({ where: { riderId, status: "WAITING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } })
export const cancel = (requestId: string, riderId: string) => db.waitlist.updateMany({ where: { requestId, riderId, status: "WAITING" }, data: { status: "CANCELLED" } })

/* joining again after a notify or cancel just reopens the same row */
export const join = (requestId: string, riderId: string, expiresAt: Date) =>
  db.waitlist.upsert({ where: { requestId }, create: { requestId, riderId, expiresAt }, update: { status: "WAITING", expiresAt, notifiedAt: null } })
