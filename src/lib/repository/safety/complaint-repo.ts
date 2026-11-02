import { db } from "@/lib/infra/clients/db"

type Type = "PAYMENT" | "ROUTE" | "RATING" | "CONDUCT" | "OTHER"
type Status = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED"

export const listByUser = (filedById: string) => db.complaint.findMany({ where: { filedById }, orderBy: { createdAt: "desc" } })
export const findOpen = (tripId: string, filedById: string, type: Type) => db.complaint.findFirst({ where: { tripId, filedById, type, status: { in: ["OPEN", "IN_REVIEW"] } } })
export const create = (data: { tripId: string; filedById: string; againstId: string; type: Type; text: string }) => db.complaint.create({ data })
export const findById = (id: string) => db.complaint.findUnique({ where: { id } })
export const listByStatus = (status: Status) =>
  db.complaint.findMany({ where: { status }, orderBy: { createdAt: "asc" }, include: { filedBy: { select: { id: true, email: true, name: true } } } })
export const update = (id: string, data: { status: Exclude<Status, "OPEN">; adminNote: string | undefined; handledById: string }) => db.complaint.update({ where: { id }, data })
