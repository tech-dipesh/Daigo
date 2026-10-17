import { getUserId } from "@/lib/infra/auth/auth"
import { redis } from "@/lib/infra/clients/redis"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { inboxKey } from "@/lib/infra/realtime/events"
import type { RealtimeEvent } from "@/lib/infra/realtime/events"

export const GET = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  const [inbox] = await redis.multi().lrange<RealtimeEvent>(inboxKey(userId), 0, -1).del(inboxKey(userId)).exec<[RealtimeEvent[], number]>()
  const events = inbox.reverse()
  return successResponse(events)
})
