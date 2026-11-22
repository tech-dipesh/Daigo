import { db } from "@/lib/infra/clients/db"

type NewExport = { type: "trips" | "users" | "complaints"; rangeFrom: Date; rangeTo: Date; requestedById: string }

export const create = (data: NewExport) => db.exportJob.create({ data })
export const recent = (take: number) => db.exportJob.findMany({ orderBy: { createdAt: "desc" }, take })
export const findById = (id: string) => db.exportJob.findUnique({ where: { id } })
export const markRunning = (id: string) => db.exportJob.update({ where: { id }, data: { status: "RUNNING", error: null } })
export const markReady = (id: string, fileKey: string) => db.exportJob.update({ where: { id }, data: { status: "READY", fileKey, finishedAt: new Date() } })
export const markFailed = (id: string, error: string) => db.exportJob.update({ where: { id }, data: { status: "FAILED", error, finishedAt: new Date() } })
