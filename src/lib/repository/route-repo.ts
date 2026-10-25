import { db } from "@/lib/infra/clients/db"

type NewRoute = Parameters<typeof db.route.create>[0]["data"]
type AutoAccept = { autoAccept: boolean; autoMinPrice: number | undefined; autoMinPerKm: number | undefined; autoMinTrust: number | undefined }

export const listByDriver = (driverId: string) => db.route.findMany({ where: { driverId } })
export const findOwned = (id: string, driverId: string) => db.route.findFirst({ where: { id, driverId } })
export const create = (data: NewRoute) => db.route.create({ data })
export const setAutoAccept = (id: string, data: AutoAccept) => db.route.update({ where: { id }, data })

type VehicleKind = "BIKE" | "SCOOTER" | "AUTO" | "CAR" | "CAB"

export const findForMatching = (ids: string[], vehiclePreference: VehicleKind | null) =>
  db.route.findMany({ where: { id: { in: ids }, ...(vehiclePreference ? { vehicle: { type: vehiclePreference } } : {}) }, include: { vehicle: true, driver: true } })
export const getById = (id: string) => db.route.findUniqueOrThrow({ where: { id } })
export const activeByDriver = (driverId: string) => db.route.findMany({ where: { driverId, status: "ACTIVE" }, include: { vehicle: true } })
