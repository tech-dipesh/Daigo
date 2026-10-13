import "dotenv/config"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import LocalRedis from "ioredis"
// upstash is i think best due to a htttp over the tcp for the serverless vercel fo
// const redistclient = process.env.NODE_ENV==="development"? (new LocalRedis(process.env.REDIS_URL || "redis://localhost:6379")): (new Redis({url: process.env.UPSTASH_REDIS_REST_URL ?? "",   token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "", }))
const redis = new Redis({
  url: process.env.REDIS_URL ?? "",
  token: process.env.REDIS_TOKEN ?? "",
})

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit-daigo",
})
