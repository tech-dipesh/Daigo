# Fix That I Work ON:

**Server stops at start and lists keys.** Those env keys are missing or invalid. Fix `.env`, nothing else is wrong.

**WebSocket returns 501.** The route only upgrades under `vercel dev` or on a deployment. Use `GET /api/v1/events` meanwhile.

**Everyone got logged out after an update.** Refresh tokens are now stored as SHA-256, old ones no longer match. Log in once.

**Uploads say "File storage is not configured".** Set the five S3 keys, they come from Supabase Storage.

**Queued work never runs locally.** With a localhost APP_URL jobs run inline, so look at the server console. On a deployment check `QTASH_TOKEN` and both signing keys.

**Prices look high in dev.** Demand compares open requests with online drivers, and with no driver online two open requests are enough to turn it on.
