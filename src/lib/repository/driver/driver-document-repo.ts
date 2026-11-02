import { db } from "@/lib/infra/clients/db"

type NewDocument = Parameters<typeof db.driverDocument.create>[0]["data"]

export const listByUser = (userId: string) => db.driverDocument.findMany({ where: { userId } })
export const findApproved = (userId: string) => db.driverDocument.findFirst({ where: { userId, verificationStatus: "APPROVED" } })
export const create = (data: NewDocument) => db.driverDocument.create({ data })

type Review = "APPROVED" | "REJECTED"

export const listByStatus = (verificationStatus: "PENDING" | "APPROVED" | "REJECTED") =>
  db.driverDocument.findMany({ where: { verificationStatus }, include: { user: { select: { id: true, email: true } } }, orderBy: { createdAt: "asc" } })
export const countPending = () => db.driverDocument.count({ where: { verificationStatus: "PENDING" } })
export const review = (id: string, status: Review, reason: string | undefined) =>
  db.driverDocument.update({ where: { id }, data: { verificationStatus: status, rejectionReason: status === "REJECTED" ? reason : null, reviewedAt: new Date() }, include: { user: true } })
