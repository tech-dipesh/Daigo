import { z } from "zod"
const schema = z.object({
  DB_URL: z.url(),
  DIRECT_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  BREVO_API_KEY: z.string().min(1),
  BREVO_FROM_EMAIL: z.email(),
  APP_URL: z.url(),
})
const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const keys = Object.keys(z.flattenError(parsed.error).fieldErrors)
  console.error(`missing or invalid env keys, server wont work: ${keys.join(", ")}`)
  // console.error("Please Enter all the env keys", envKey);
  process.exit(1)
}
export const env = parsed.data
