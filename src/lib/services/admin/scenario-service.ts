import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"
import { demoDomain } from "@/lib/infra/demo/config"
import * as demoResetRepo from "@/lib/repository/admin/demo-reset-repo"
import * as scenarioRepo from "@/lib/repository/admin/scenario-repo"
import { doubleAccept, noDriver, normalMatch } from "@/lib/services/admin/scenarios/flow"
import { recorder, type Actors, type Rec } from "@/lib/services/admin/scenarios/kit"
import { cancelAfterAccept, emergency, paymentMismatch, vulnerableRequest } from "@/lib/services/admin/scenarios/risk"
import { scenarioNames, type ScenarioInput } from "@/lib/validation/admin/demo-schema"

type Name = (typeof scenarioNames)[number]

const registry: Record<Name, (actors: Actors, rec: Rec) => Promise<void>> = {
  "normal-match": normalMatch,
  "no-driver": noDriver,
  "double-accept": doubleAccept,
  emergency,
  "cancel-after-accept": cancelAfterAccept,
  "payment-mismatch": paymentMismatch,
  "vulnerable-request": vulnerableRequest,
}

async function runOne(name: Name, actors: Actors) {
  const rec = recorder()
  const started = Date.now()
  try {
    await registry[name](actors, rec)
  } catch (error) {
    rec.add("stopped with an error", false, error instanceof Error ? error.message : "unknown error")
  }
  return { name, ok: rec.steps.length > 0 && rec.steps.every((s) => s.ok), ms: Date.now() - started, steps: rec.steps }
}

export const listScenarios = () => scenarioNames

/*
  each run starts by clearing what earlier runs made,
  so it can be repeated
*/
export async function runScenarios({ name }: ScenarioInput) {
  const ids = await demoResetRepo.demoUserIds(demoDomain, env.DEMO_LIVE_EMAIL)
  const actors = await scenarioRepo.actors(ids)
  if (actors.routes.length < 10 || actors.riders.length < 7) throw new AppError("Seed the demo first, scenarios need 10 demo drivers and 7 demo riders", 409)
  const cleared = await scenarioRepo.clearScenarios()
  await scenarioRepo.restoreRoutes(actors.routes)
  const names = name === "all" ? scenarioNames : [name]
  const results = []
  for (const each of names) results.push(await runOne(each, actors))
  return { cleared, passed: results.filter((r) => r.ok).length, total: results.length, results }
}
