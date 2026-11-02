import { db } from "@/lib/infra/clients/db"

type NewContact = Parameters<typeof db.emergencyContact.create>[0]["data"]

export const listContacts = (userId: string) => db.emergencyContact.findMany({ where: { userId } })
export const createContact = (data: NewContact) => db.emergencyContact.create({ data })
export const createEvent = (data: { userId: string; tripId: string | undefined; lat: number; lng: number }) => db.emergencyEvent.create({ data })
export const resolve = (id: string) => db.emergencyEvent.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } })
export const listOpen = () =>
  db.emergencyEvent.findMany({ where: { status: "OPEN" }, include: { user: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "desc" } })
