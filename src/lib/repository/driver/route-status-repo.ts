import { db } from "@/lib/infra/clients/db"

export const setStatus = (id: string, status: "ACTIVE" | "PAUSED") => db.route.update({ where: { id }, data: { status } })
