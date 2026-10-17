import "dotenv/config"
import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/infra/clients/redis"
// upstash is i think best due to a htttp over the tcp for the serverless vercel fo
// const redistclient = process.env.NODE_ENV==="development"? (new LocalRedis(process.env.REDIS_URL || "redis://localhost:6379")): (new Redis({url: process.env.UPSTASH_REDIS_REST_URL ?? "",   token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "", }))

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit-daigo",
})
