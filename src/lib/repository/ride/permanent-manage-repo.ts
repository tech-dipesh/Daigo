import { db } from "@/lib/infra/clients/db"

type NewTemplate = { riderId: string; fromLabel: string; fromLat: number; fromLng: number; toLabel: string; toLat: number; toLng: number; daysOfWeek: number[]; windowStartTime: Date; windowEndTime: Date; groupSize: number; vehiclePreference?: "BIKE" | "SCOOTER" | "CAR" | "AUTO" | "CAB" }

export const listActive = (riderId: string) => db.permanentRideRequest.findMany({ where: { riderId, isActive: true }, orderBy: { createdAt: "desc" } })
export const countActive = (riderId: string) => db.permanentRideRequest.count({ where: { riderId, isActive: true } })
export const create = (data: NewTemplate) => db.permanentRideRequest.create({ data })
export const deactivate = (id: string, riderId: string) => db.permanentRideRequest.updateMany({ where: { id, riderId, isActive: true }, data: { isActive: false } })
