import "dotenv/config"
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
  STADIA_API: z.string().min(1),
  OWM_KEY: z.string().optional(),
  S3_URL: z.url(),
  S3_KEY: z.string().min(1),
  S3_SECRET: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().default("ap-northeast-1"),
  QTASH_TOKEN: z.string().optional(),
  QTASH_CURRENT: z.string().optional(),
  QTASH_NEXT: z.string().optional(),
})
const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const keys = Object.keys(z.flattenError(parsed.error).fieldErrors)
  console.error(`missing or invalid env keys, server wont work: ${keys.join(", ")}`)
  // console.error("Please Enter all the env keys", envKey);
  process.exit(1)
}
export const env = parsed.data
