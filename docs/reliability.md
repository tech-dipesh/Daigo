# Reliability: what is done and what is not

## Done
- Idempotency keys: same key and same body replays the first answer, same key with a different body is rejected. Kept 24 hours in Redis. Used on payments, split payments, ride requests, retries and saved route requests.
- Webhook verification: background jobs arrive from QStash and the signature is checked before anything runs. Razorpay webhooks are verified over the raw body with the webhook secret, compared in constant time, and repeated events are skipped by their event id.
- Payments: the checkout result is verified against Razorpay (signature and order amount) and the webhook does the same. Both settle through one guarded update, so the second one is a no-op. A job every 15 minutes asks Razorpay about payments stuck in pending and reports paid-but-refunded ones.
- Event stream: notifications go through a Redis stream with a consumer group. Failed events are reclaimed after 30 seconds and after 5 tries they move to a dead stream.
- Rate limiting: sliding window of 60 requests a minute per IP in the proxy. OTP codes allow 5 attempts.
- Token revocation: refresh tokens are stored hashed and rotate on every use. Resetting a password or deleting an account revokes all of them in the same transaction.
- Atomic transactions: accept, relay confirm, cancel, payment and coin changes run in transactions with guarded updates.
- Data rules in the database: enums for every status, unique constraints for duplicates, UUIDs from Postgres.
- Safe uploads: files go straight to S3 with short lived signed links.
- Deploy safety: health route, migrate before start, wait for healthy, automatic and manual rollback.

## Missing
- Automated tests. I decided to ship without them for now, so correctness rests on the demo console scenarios.
- Split shares are not reconciled. They keep no order id, so they depend on the webhook alone.
- Limits per user or per route. Rate limiting is per IP only.
- Account lock after repeated wrong passwords. Only OTP attempts are limited.
- Dead letters for QStash jobs. Stream events have a dead stream, QStash jobs only retry.
- Metrics, alerts and central logs. Today it is docker logs and the health route.
- Automated backups of Postgres.
- A content security policy header. Skipped on purpose for now, the map, S3 images and the websocket would all need allow lists.
