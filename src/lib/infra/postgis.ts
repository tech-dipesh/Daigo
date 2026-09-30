import { z } from "zod"
import { db } from "@/lib/infra/db"

const candidateRowSchema = z.object({
  id: z.string(),
  pickup_distance_km: z.number(),
  dropoff_distance_km: z.number(),
})

type GeoCandidateParams = {
  riderId: string
  groupSize: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}

export async function findGeoCandidates(params: GeoCandidateParams) {
  const { riderId, groupSize, fromLat, fromLng, toLat, toLng } = params
  // make long lat for going backward
  const rows = await db.$queryRaw`
    SELECT r.id,
      ST_Distance(
        ST_MakePoint(${fromLng}, ${fromLat})::geography,
        ST_MakePoint(r.from_lng, r.from_lat)::geography
      ) / 1000 AS pickup_distance_km,
      ST_Distance(
        ST_MakePoint(${toLng}, ${toLat})::geography,
        ST_MakePoint(r.to_lng, r.to_lat)::geography
      ) / 1000 AS dropoff_distance_km
    FROM routes r
    WHERE r.status = 'ACTIVE'
      AND r.driver_id != ${riderId}
      AND r.seats_available >= ${groupSize}
      AND ST_DWithin(
        ST_MakePoint(${fromLng}, ${fromLat})::geography,
        ST_MakePoint(r.from_lng, r.from_lat)::geography,
        r.detour_limit_km * 1000
      )
      AND ST_DWithin(
        ST_MakePoint(${toLng}, ${toLat})::geography,
        ST_MakePoint(r.to_lng, r.to_lat)::geography,
        r.detour_limit_km * 1000
      )
  `

  return candidateRowSchema.array().parse(rows)
}
