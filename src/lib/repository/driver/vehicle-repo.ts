import { db } from "@/lib/infra/clients/db"

type NewVehicle = Parameters<typeof db.vehicle.create>[0]["data"]

export const listByOwner = (ownerId: string) => db.vehicle.findMany({ where: { ownerId } })
export const findOwned = (id: string, ownerId: string) => db.vehicle.findFirst({ where: { id, ownerId } })
export const create = (data: NewVehicle) => db.vehicle.create({ data })

type Review = "APPROVED" | "REJECTED"

export const listByStatus = (verificationStatus: "PENDING" | "APPROVED" | "REJECTED") =>
  db.vehicle.findMany({ where: { verificationStatus }, include: { owner: { select: { id: true, email: true } } }, orderBy: { createdAt: "asc" } })
export const countPending = () => db.vehicle.count({ where: { verificationStatus: "PENDING" } })
export const review = (id: string, status: Review, reason: string | undefined) =>
  db.vehicle.update({ where: { id }, data: { verificationStatus: status, rejectionReason: status === "REJECTED" ? reason : null, reviewedAt: new Date() }, include: { owner: true } })
