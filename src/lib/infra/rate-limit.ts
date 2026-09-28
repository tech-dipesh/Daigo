import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.REDIS_REST_URL ?? "",
  token: process.env.REDIS_REST_TOKEN ?? "",
})

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "daigo-ratelimit",
})
