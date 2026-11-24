# Architecture

```
request
  -> proxy.ts          auth cookie check, silent refresh, rate limit
  -> route.ts          parse with zod, call one service, wrap the result
  -> services          business rules, one concern per file
  -> repository        every prisma query, named after what it does
  -> postgres / redis  postgis for matching, redis for pub/sub and cache
```

## Layers

| Folder | Job |
| --- | --- |
| src/app/api/v1 | thin routes, grouped by role |
| src/lib/validation | zod schemas and their inferred input types |
| src/lib/services | business rules, each file under 100 lines |
| src/lib/repository | prisma access, transactions live here |
| src/lib/infra | clients (db, redis, email, s3, stadia) and engines |

Routes never import the database client. Services never import it either, they go through a repository.

## Engines

`lib/infra/economy` (pricing, trust, warnings), `lib/infra/matching` (postgis, relay, schedule) and `lib/infra/auth` (tokens, otp) are domain engines and still read the database directly. Moving their queries behind repositories is the next cleanup.

## Real time

A Vercel Function holds the WebSocket. Each connection subscribes to its own Redis channel, so any instance can reach any user. Every event is also pushed into a short inbox list, which `GET /api/v1/events` serves when the socket is down.

## Background work

Emails, notification rows, the 6 AM auto-post and CSV exports run as QStash jobs through one signed endpoint, `POST /api/v1/jobs/run`. In local dev they run inline.
