import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/infra/clients/redis"
import { AppError } from "@/lib/infra/http/response"

const make = (name: string, tokens: number, window: "1 m" | "1 h") => new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `limit-${name}` })

/*
  it's s stricted limit where the login is 5 per minute
  it's more like a strict with doing a actions from the redis.
*/
const limiters = {
  login: make("login", 5, "1 m"),
  code: make("code", 5, "1 m"),
  reset: make("reset", 3, "1 h"),
  emergency: make("emergency", 3, "1 m"),
  upload: make("upload", 20, "1 m"),
}

export async function enforceLimit(action: keyof typeof limiters, key: string) {
  const { success } = await limiters[action].limit(key)
  if (!success) throw new AppError("Too many attempts, please wait a bit and try again", 429)
}
