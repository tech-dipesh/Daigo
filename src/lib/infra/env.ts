import "dotenv/config"
import { z } from 'zod';
const envSchema = z.object({
  DATABASE_URL: z.string(),
  DATABASE_PASSWORD: z.string(),
  DIRECT_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REDIS_REST_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_TOKEN: z.string(),
  BREVO_FROM_EMAIL: z.email(),
  BREVO_API_KEY: z.string(),
  APP_URL: z.string(),
});

const parsedValue = envSchema.safeParse(process.env);
if (!parsedValue.success) {
  const envKey = parsedValue.error.issues[0]?.path[0];
  console.error(`Please Enter ${String(envKey)} Key in .env File`)
  // console.error("Please Enter all the env keys", envKey);
  process.exit(1);
}
export const env = parsedValue.data;