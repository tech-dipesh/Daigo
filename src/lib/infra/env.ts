import { z } from 'zod';
const envSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REDIS_REST_URL: z.url(),
  REDIS_URL: z.url(),
  REDIS_TOKEN: z.string().min(1),
  BREVO_FROM_EMAIL: z.email(),
  BREVO_API_KEY: z.string().min(1),
  APP_URL: z.url(),
});

const parsedValue = envSchema.safeParse(process.env);
if (!parsedValue.success) {
  const envKey = parsedValue.error.issues[0]?.path[0];
  console.error(`Please Enter ${String(envKey)} Key in .env File`)
  // console.error("Please Enter all the env keys", envKey);
  process.exit(1);
}
export const env = parsedValue.data;