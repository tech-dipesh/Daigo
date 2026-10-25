import { db } from "@/lib/infra/clients/db"

type Kind = "WARNING" | "ACCOUNT"
type Status = "OPEN" | "APPROVED" | "REJECTED"
export type Appeal = NonNullable<Awaited<ReturnType<typeof findById>>>

export const listByUser = (userId: string) => db.appeal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
export const findOpen = (userId: string, kind: Kind, warningId: string | null) => db.appeal.findFirst({ where: { userId, kind, status: "OPEN", warningId } })
export const create = (data: { userId: string; kind: Kind; warningId: string | null; text: string }) => db.appeal.create({ data })
export const findById = (id: string) => db.appeal.findUnique({ where: { id } })
export const listByStatus = (status: Status) =>
  db.appeal.findMany({ where: { status }, orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, email: true, name: true } }, warning: true } })

/* approving also lifts the warning or the ban, all in one transaction */
export function decide(appeal: Appeal, status: "APPROVED" | "REJECTED", note: string | undefined, staffId: string) {
  return db.$transaction(async (tx) => {
    if (status === "APPROVED" && appeal.kind === "WARNING" && appeal.warningId) {
      await tx.warning.update({ where: { id: appeal.warningId }, data: { revokedAt: new Date() } })
    }
    if (status === "APPROVED" && appeal.kind === "ACCOUNT") {
      await tx.user.update({ where: { id: appeal.userId }, data: { isBanned: false, warningCycleStart: new Date() } })
    }
    return tx.appeal.update({ where: { id: appeal.id }, data: { status, decisionNote: note, decidedById: staffId, decidedAt: new Date() } })
  })
}
