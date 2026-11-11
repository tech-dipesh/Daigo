import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/infra/clients/db"

const candidateRowSchema = z.object({
  id: z.string(),
  pickup_distance_km: z.number(),
  dropoff_distance_km: z.number(),
})

export type GeoCandidateParams = {
  riderId: string
  groupSize: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}

export const maxDetourKm = 20

export function candidateSql(params: GeoCandidateParams) {
  /* coarse filter at the max detour can use the gist index, the per route limit is checked after it */
  const { riderId, groupSize, fromLat, fromLng, toLat, toLng } = params
  const reach = maxDetourKm * 1000
  const from = Prisma.sql`ST_SetSRID(ST_MakePoint(${fromLng}::float8, ${fromLat}::float8), 4326)::geography`
  const to = Prisma.sql`ST_SetSRID(ST_MakePoint(${toLng}::float8, ${toLat}::float8), 4326)::geography`
  return Prisma.sql`
    SELECT r.id,
      ST_Distance(r.from_geog, ${from}) / 1000 AS pickup_distance_km,
      ST_Distance(r.to_geog, ${to}) / 1000 AS dropoff_distance_km
    FROM routes r
    WHERE r.status = 'ACTIVE'
      AND r.driver_id != ${riderId}::uuid
      AND r.seats_available >= ${groupSize}::int
      AND ST_DWithin(r.from_geog, ${from}, ${reach}::float8)
      AND ST_DWithin(r.to_geog, ${to}, ${reach}::float8)
      AND ST_DWithin(r.from_geog, ${from}, r.detour_limit_km * 1000)
      AND ST_DWithin(r.to_geog, ${to}, r.detour_limit_km * 1000)
  `
}

export async function findGeoCandidates(params: GeoCandidateParams) {
  const rows = await db.$queryRaw(candidateSql(params))
  return candidateRowSchema.array().parse(rows)
}
