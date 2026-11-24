# Why it is built this way

Short notes on the choices that cost me the most time, and what I gave up for each.

## One Next.js app, plus a small ws server
Pages and the api live in one project so there is one deploy and one type system. The only thing that does not fit is a long lived websocket, so that is a tiny Bun process (`src/server/ws-server.ts`) that imports about a dozen files. Redis pub/sub connects the two, so any api instance can push to any connected driver. If the socket drops, the client falls back to polling and posts a presence beat every 30 seconds so a driver still shows as online.

## First accept wins
Two drivers can tap accept in the same second. The accept is one transaction with guarded updates: the request moves from PENDING to MATCHED only if it is still PENDING, and the seats are decremented only if enough are left. The loser gets a 409, nothing is half written. I did not use a lock or a queue because the database already gives the guarantee for free. The demo console has a scenario that fires two accepts at once and checks that exactly one wins.

## Relay matching
When no single driver covers the trip, the engine looks for two routes whose ends meet within 3 km of a handover point. It is only a fallback, direct matches always come first. A relay becomes real only when both drivers accept, in one transaction. Cost: the search runs in memory over candidates PostGIS already narrowed down, so it will not scale to a big city without more work.

## PostGIS and raw SQL
Prisma cannot express "within X metres of a line", so matching is raw SQL with typed results. The demo console runs the same query against a plain scan on 20,000 generated routes and prints EXPLAIN for both, so the index claim can be checked instead of trusted.

## Pricing
Per km rate by vehicle, times zone (hills cost more), time of day, weather and demand. The stacked multiplier is capped at 1.5, the rate at 40 a km, and the final rupee value is rounded first and capped after, so rounding can never push a fare over the cap. The price is only a suggestion, drivers and riders agree it in chat.

## Privacy by distance
The driver's name and phone stay hidden until they are within 10 km of the pickup, and the photo until 3 km. This is checked on the server, the data is never sent early, so hiding it in the UI is not the protection.

## Deploy
Docker on one EC2 box behind Caddy. A deploy builds three images, runs migrations in a one shot container, starts everything with health checks and rolls back to the last good tag if it is unhealthy. Migrations are not rolled back, so they must stay backwards compatible. The cost of this setup is one machine: no failover.
