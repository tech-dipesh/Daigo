import { randomUUID } from "node:crypto"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { demoDomain } from "@/lib/infra/demo/config"
import { buildRoutes, points, stats } from "@/lib/infra/demo/bench-data"
import { candidateSql } from "@/lib/infra/matching/postgis"
import * as benchRepo from "@/lib/repository/admin/benchmark-repo"
import * as demoResetRepo from "@/lib/repository/admin/demo-reset-repo"
import type { BenchmarkInput } from "@/lib/validation/admin/demo-schema"

export async function runBenchmark({ routes, runs }: BenchmarkInput) {
  const ids = await demoResetRepo.demoUserIds(demoDomain, env.DEMO_LIVE_EMAIL)
  /*
    add a fake route with the times and the old scan with a gist index.
  */
  const vehicles = await benchRepo.demoVehicles(ids)
  if (!vehicles.length) throw new AppError("Seed the demo first, the benchmark needs demo drivers", 409)
  await benchRepo.removeBench()
  await benchRepo.insertRoutes(buildRoutes(routes, vehicles))
  try {
    const riderId = randomUUID()
    const params = points.map((p) => ({ ...p, riderId, groupSize: 1 }))
    const fastSql = params.map(candidateSql)
    const slowSql = params.map(benchRepo.scanSql)
    const fast = await benchRepo.timeQueries(fastSql, runs)
    const slow = await benchRepo.timeQueries(slowSql, runs)
    const [fastPlan, slowPlan] = [await benchRepo.explain(fastSql[0]), await benchRepo.explain(slowSql[0])]
    const indexed = { ...stats(fast.ms), explainMs: fastPlan.ms, plan: fastPlan.node, usesIndex: fastPlan.usesIndex }
    const scan = { ...stats(slow.ms), explainMs: slowPlan.ms, plan: slowPlan.node, usesIndex: slowPlan.usesIndex }
    const speedup = Math.round((scan.p50 / Math.max(indexed.p50, 0.01)) * 10) / 10
    return { totalActiveRoutes: await benchRepo.routeCount(), addedRoutes: routes, runs, indexed, scan, speedup, avgCandidates: fast.avgRows }
  } finally {
    await benchRepo.removeBench()
  }
}
