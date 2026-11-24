# Setup

```
pnpm install
cp .env.example .env     # fill the keys below
pnpm migrate && pnpm generate
pnpm seed                # zones and fare rates, runs with bun
pnpm dev
```

The server refuses to start and names the missing keys, because `next.config.ts` loads `env.ts` first.

## Keys

| Key | Needed | Where from |
| --- | --- | --- |
| DB_URL, DIRECT_URL | yes | Neon or Supabase Postgres, pooled and direct |
| ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET | yes | random strings, 32+ characters |
| UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | yes | Upstash console |
| BREVO_API_KEY, BREVO_FROM_EMAIL | yes | Brevo, SMTP and API keys |
| APP_URL | yes | public url, localhost in dev |
| STADIA_API | yes | Stadia Maps dashboard |
| OWM_KEY | no | openweathermap.org, see below |
| S3_BUCKET, S3_REGION, S3_URL, S3_KEY, S3_SECRET | no | AWS S3 (default) or any S3 compatible store, see Storage |
| QTASH_TOKEN, QTASH_CURRENT, QTASH_NEXT | no | Upstash QStash console |
| DEMO_MODE, DEMO_LIVE_EMAIL | no | DEMO_MODE=true turns the demo console on, DEMO_LIVE_EMAIL is the one demo account that receives real emails |

## OpenWeatherMap key (OWM_KEY)

1. Sign up at openweathermap.org and confirm the email.
2. Open your profile menu, then "My API keys".
3. Copy the default key, or create one named daigo.
4. A new key can take from a few minutes up to a couple of hours to start working.

for our free plan the weather endpoint DaiGo can be enough.

## Storage

I'm making Sure Primary S3 client will be a AWS S3 but i can port on later on any S3 Compatible

- AWS S3: set S3_BUCKET and S3_REGION (default ap-south-1, Mumbai) and leave S3_URL empty. On EC2 attach an IAM role and leave S3_KEY and S3_SECRET empty. Anywhere else create an IAM user limited to this one bucket.
- Supabase Storage: also set S3_URL to its S3 endpoint and use its S3 access keys.
- On AWS the bucket stays private with all public access blocked, a CORS rule allows PUT and GET from your site, and the policy needs s3:PutObject, s3:GetObject and s3:DeleteObject on the bucket objects.

Until the bucket is set, uploads answer "File storage is not configured".

## Demo console

Super admin only and only while `DEMO_MODE=true`. All demo accounts use the `@dipsharma.me` domain and the password `Daigo#666`, and the mailer skips that domain.

| Call | What it does |
| --- | --- |
| POST /api/v1/admin/demo/seed | `{ "size": "full" }` makes 61 accounts, `"quick"` makes 30 (20 riders, 10 drivers), always after a reset |
| POST /api/v1/admin/demo/reset | removes demo accounts and everything they own, never staff |
| GET /api/v1/admin/demo/status, /health | counts, and a check of postgres, redis, routing, weather, storage, queue, email |
| POST /api/v1/admin/demo/force/assign, expire, arrival | force a match, expire a request, or pretend the driver arrived minutes ago |

## Optional pieces

Without QTASH_TOKEN, or with a localhost APP_URL, background jobs run inline instead of through QStash.

## When something breaks
Server stops at start and lists keys. Those env keys are missing or invalid. Fix `.env`, nothing else is wrong.

WebSocket returns 501. The route only upgrades under `vercel dev` or on a deployment. Use `GET /api/v1/events` meanwhile.

Everyone got logged out after an update. Refresh tokens are now stored as SHA-256, old ones no longer match. Log in once.

Uploads say "File storage is not configured". Set S3_BUCKET (and keys, unless an EC2 role provides them).

Queued work never runs locally. With a localhost APP_URL jobs run inline, so look at the server console. On a deployment check `QTASH_TOKEN` and both signing keys.

Prices look high in dev. Demand compares open requests with online drivers, and with no driver online two open requests are enough to turn it on.
