import "dotenv/config"
import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/infra/clients/redis"
// upstash is i think best due to a htttp over the tcp for the serverless vercel fo
// const redistclient = process.env.NODE_ENV==="development"? (new LocalRedis(process.env.REDIS_URL || "redis://localhost:6379")): (new Redis({url: process.env.UPSTASH_REDIS_REST_URL ?? "",   token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "", }))

/* anyone not signed in is counted by ip, 60 a minute is plenty for login and signup */
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit-daigo",
})

/*
  a signed in person is counted by their own id, not their ip
  a whole college or office shares one ip, and the app polls a few times a minute when the socket is down
*/
export const memberLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, "1 m"),
  prefix: "ratelimit-daigo-user",
})

/* local dev would wait on a redis far away for every request, and nobody needs the limit there */
export const limitOn = process.env.NODE_ENV === "production"
