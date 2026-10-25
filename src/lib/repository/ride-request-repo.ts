import { db } from "@/lib/infra/clients/db"

type NewRequest = Parameters<typeof db.rideRequest.create>[0]["data"]
type Trip = { fromLat: number; fromLng: number; toLat: number; toLng: number; windowStart: Date; windowEnd: Date }
export type RideRequest = NonNullable<Awaited<ReturnType<typeof findOwned>>>

export const listByRider = (riderId: string) => db.rideRequest.findMany({ where: { riderId } })
export const findOwned = (id: string, riderId: string) => db.rideRequest.findFirst({ where: { id, riderId } })
export const minorAgeOf = async (id: string) => (await db.rideRequest.findUniqueOrThrow({ where: { id }, select: { minorAge: true } })).minorAge
export const create = (data: NewRequest) => db.rideRequest.create({ data })

export const findDuplicate = (riderId: string, trip: Trip) =>
  db.rideRequest.findFirst({
    where: {
      riderId,
      status: "PENDING",
      fromLat: trip.fromLat,
      fromLng: trip.fromLng,
      toLat: trip.toLat,
      toLng: trip.toLng,
      windowStart: { lt: trip.windowEnd },
      windowEnd: { gt: trip.windowStart },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

/* old one is closed and a copy with a fresh window opens, together */
export const replaceWithCopy = (old: RideRequest, windowStart: Date, windowEnd: Date, expiresAt: Date) =>
  db.$transaction(async (tx) => {
    await tx.rideRequest.update({ where: { id: old.id }, data: { status: "EXPIRED" } })
    return tx.rideRequest.create({
      data: {
        riderId: old.riderId,
        fromLabel: old.fromLabel,
        fromLat: old.fromLat,
        fromLng: old.fromLng,
        toLabel: old.toLabel,
        toLat: old.toLat,
        toLng: old.toLng,
        windowStart,
        windowEnd,
        groupSize: old.groupSize,
        hasLuggage: old.hasLuggage,
        notes: old.notes,
        isVulnerable: old.isVulnerable,
        womenOnly: old.womenOnly,
        acOnly: old.acOnly,
        allowShared: old.allowShared,
        minorName: old.minorName,
        minorAge: old.minorAge,
        vehiclePreference: old.vehiclePreference,
        expiresAt,
      },
    })
  })
