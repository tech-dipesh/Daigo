import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/infra/clients/db"
import { benchLabel } from "@/lib/infra/demo/bench-data"
import type { GeoCandidateParams } from "@/lib/infra/matching/postgis"

const planSchema = z.preprocess(
  (v) => (typeof v === "string" ? JSON.parse(v) : v),
  z.array(z.object({ "Execution Time": z.number(), Plan: z.object({ "Node Type": z.string() }) })).min(1),
)

export const scanSql = ({ riderId, groupSize, fromLat, fromLng, toLat, toLng }: GeoCandidateParams) => {
  const from = Prisma.sql`ST_MakePoint(${fromLng}::float8, ${fromLat}::float8)::geography`
  const to = Prisma.sql`ST_MakePoint(${toLng}::float8, ${toLat}::float8)::geography`
  return Prisma.sql`
    SELECT r.id FROM routes r
    WHERE r.status = 'ACTIVE' AND r.driver_id != ${riderId}::uuid AND r.seats_available >= ${groupSize}::int
      AND ST_DWithin(${from}, ST_MakePoint(r.from_lng, r.from_lat)::geography, r.detour_limit_km * 1000)
      AND ST_DWithin(${to}, ST_MakePoint(r.to_lng, r.to_lat)::geography, r.detour_limit_km * 1000)
  `
}

export const demoVehicles = (ids: string[]) =>
  db.vehicle.findMany({ where: { ownerId: { in: ids } }, select: { id: true, ownerId: true, seatCapacity: true } })

export async function insertRoutes(rows: Prisma.RouteCreateManyInput[]) {
  const chunks = Array.from({ length: Math.ceil(rows.length / 1000) }, (_, i) => rows.slice(i * 1000, (i + 1) * 1000))
  for (const data of chunks) await db.route.createMany({ data })
  await db.$executeRaw`ANALYZE routes`
}

export const removeBench = () => db.route.deleteMany({ where: { fromLabel: benchLabel } })
export const routeCount = () => db.route.count({ where: { status: "ACTIVE" } })

export async function timeQueries(queries: Prisma.Sql[], runs: number) {
  const ms: number[] = []
  let rows = 0
  for (let i = 0; i <= runs; i++) {
    const started = performance.now()
    const found = await db.$queryRaw<unknown[]>(queries[i % queries.length])
    if (i > 0) ms.push(performance.now() - started)
    rows += found.length
  }
  return { ms, avgRows: Math.round(rows / (runs + 1)) }
}

export async function explain(query: Prisma.Sql) {
  const rows = await db.$queryRaw<{ "QUERY PLAN": unknown }[]>(Prisma.sql`EXPLAIN (ANALYZE, FORMAT JSON) ${query}`)
  const [first] = planSchema.parse(rows[0]?.["QUERY PLAN"])
  return { ms: first["Execution Time"], node: first.Plan["Node Type"], usesIndex: JSON.stringify(rows).includes("Index Scan") }
}
