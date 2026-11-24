# Reliability: What I've Already Build
## Done
- Idempotency keys: same key and same body replays the first answer, same key with a different body is rejected. Kept 24 hours in Redis. Used on payments, split payments, ride requests, retries and saved route requests.
- Webhook verification: background jobs arrive from QStash and the signature is checked before anything runs.
- Rate limiting: sliding window of 60 requests a minute per IP in the proxy. OTP codes allow 5 attempts.
- Token revocation: refresh tokens are stored hashed and rotate on every use. Resetting a password or deleting an account revokes all of them in the same transaction.
- Atomic transactions: accept, relay confirm, cancel, payment and coin changes run in transactions with guarded updates.
- Data rules in the database: enums for every status, unique constraints for duplicates, UUIDs from Postgres.
- Safe uploads: files go straight to S3 with short lived signed links.
- Deploy safety: health route, migrate before start, wait for healthy, automatic and manual rollback.
- Real payment webhooks. The gateway is a mock, so there is nothing to verify or reconcile yet.
- A proper queue with dead letters. QStash retries, but failed jobs are not parked anywhere.

## What i'll build.
- Automated tests. I decided to ship without them for now, so correctness rests on the demo console scenarios.
- Limits per user or per route. Rate limiting is per IP only.
- Account lock after repeated wrong passwords. Only OTP attempts are limited.
- Metrics, alerts and central logs. Today it is docker logs and the health route.
- Automated backups of Postgres.
- A content security policy header.
