import { db } from "@/lib/infra/clients/db"
import { redis } from "@/lib/infra/clients/redis"

const limit = 3000
const started = Date.now()

const within = <T>(job: PromiseLike<T>) => Promise.race([job, new Promise<never>((_, no) => setTimeout(() => no(new Error("timeout")), limit))])

/*
  I think
   a hung database has to fail the check, not hang it
*/

async function alive(job: PromiseLike<unknown>) {
  try {
    await within(job)
    return true
  } catch { return false }
}

export async function checkHealth() {
  const [database, cache] = await Promise.all([alive(db.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`), alive(redis.ping())])
  return { database, cache, uptime: Math.round((Date.now() - started) / 1000) }
}
