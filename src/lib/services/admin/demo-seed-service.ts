import { env } from "@/lib/infra/clients/env"
import { hashPassword } from "@/lib/infra/auth/password"
import { demoDomain, demoPassword } from "@/lib/infra/demo/config"
import * as demoResetRepo from "@/lib/repository/admin/demo-reset-repo"
import * as demoSeedRepo from "@/lib/repository/admin/demo-seed-repo"
import { buildPlan } from "@/lib/services/admin/demo-data"
import type { DemoSeedInput } from "@/lib/validation/admin/demo-schema"

const demoIds = () => demoResetRepo.demoUserIds(demoDomain, env.DEMO_LIVE_EMAIL)

export async function resetDemo() {
  const ids = await demoIds()
  if (ids.length) await demoResetRepo.wipe(ids)
  return { removedUsers: ids.length }
}

export async function seedDemo({ size }: DemoSeedInput) {
  const started = Date.now()
  await resetDemo()
  // Idempoteent Seeding no duoble and with dedup.
  const passwordHash = await hashPassword(demoPassword)
  const plan = buildPlan(size, passwordHash, env.DEMO_LIVE_EMAIL)
  await demoSeedRepo.insertPlan(plan)
  const created = Object.fromEntries(Object.entries(plan).map(([table, rows]) => [table, Array.isArray(rows) ? rows.length : 0]))
  return { size, ms: Date.now() - started, created, password: demoPassword, liveAccount: env.DEMO_LIVE_EMAIL ?? null }
}

export async function demoStatus() {
  const ids = await demoIds()
  const [users, vehicles, routes, requests, trips] = await demoResetRepo.counts(ids)
  return { demoMode: true, domain: demoDomain, liveAccount: env.DEMO_LIVE_EMAIL ?? null, users, vehicles, routes, requests, trips }
}
