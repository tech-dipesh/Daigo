import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { getUserId } from "@/lib/infra/auth/auth"
import { redis } from "@/lib/infra/clients/redis"
import { AppError } from "@/lib/infra/http/response"
import type { RouteHandler } from "@/lib/infra/http/with-error-handling"

type Saved = { hash: string; state: "processing" | "done"; status?: number; body?: string }

const keyPattern = /^[A-Za-z0-9_-]{8,100}$/
const ttlSeconds = 60 * 60 * 24

function replay(saved: Saved | null, hash: string) {
  if (!saved) throw new AppError("Please retry, the earlier request just expired", 409)
  if (saved.hash !== hash) throw new AppError("This Idempotency-Key was already used for a different request", 422)
  if (saved.state === "processing" || saved.body === undefined) throw new AppError("A request with this key is still running", 409)
  return new NextResponse(saved.body, { status: saved.status, headers: { "content-type": "application/json", "idempotent-replay": "true" } })
}

/*
  same key and same body gives back the first answer, nothing runs twice
  only successful answers are kept so a failed try can be sent again
*/
export function withIdempotency<Context>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    const key = request.headers.get("idempotency-key") ?? ""
    if (!keyPattern.test(key)) throw new AppError("Send an Idempotency-Key header, 8 to 100 letters, numbers, dash or underscore", 400)
    const redisKey = `idem:${getUserId(request)}:${key}`
    const body = await request.clone().text()
    const hash = createHash("sha256").update(`${request.method}${request.nextUrl.pathname}${body}`).digest("hex")
    const claimed = await redis.set<Saved>(redisKey, { hash, state: "processing" }, { nx: true, ex: ttlSeconds })
    if (!claimed) return replay(await redis.get<Saved>(redisKey), hash)
    try {
      const response = await handler(request, context)
      const text = await response.clone().text()
      if (response.ok) await redis.set<Saved>(redisKey, { hash, state: "done", status: response.status, body: text }, { ex: ttlSeconds })
      else await redis.del(redisKey)
      return response
    } catch (error) {
      await redis.del(redisKey)
      throw error
    }
  }
}
