import { db } from "@/lib/infra/clients/db"

type VehicleKind = "BIKE" | "SCOOTER" | "AUTO" | "CAR" | "CAB"

export const listZones = () => db.zone.findMany({ orderBy: { name: "asc" } })
export const updateZone = (id: string, data: { name?: string; multiplier?: number }) => db.zone.update({ where: { id }, data })
export const listRates = () => db.fareRate.findMany({ orderBy: { perKm: "asc" } })
export const setRate = (vehicleType: VehicleKind, perKm: number) => db.fareRate.upsert({ where: { vehicleType }, create: { vehicleType, perKm }, update: { perKm } })
