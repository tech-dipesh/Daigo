import { db } from "@/lib/infra/clients/db"

type NewUpload = Parameters<typeof db.upload.create>[0]["data"]

export const create = (data: NewUpload) => db.upload.create({ data })
export const findOwned = (id: string, userId: string) => db.upload.findFirst({ where: { id, userId } })
export const findUploaded = (id: string) => db.upload.findFirst({ where: { id, status: "UPLOADED" } })
export const markUploaded = (id: string) => db.upload.update({ where: { id }, data: { status: "UPLOADED" } })
