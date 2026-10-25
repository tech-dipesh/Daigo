import { db } from "@/lib/infra/clients/db"

export const findById = (id: string) => db.otpCode.findUnique({ where: { id } })
