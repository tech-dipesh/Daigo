import { redis } from "@/lib/infra/clients/redis"

const driversKey = "online:drivers"
const staleMs = 90 * 1000
export const setOnline = (userId: string) => redis.zadd(driversKey, { score: Date.now(), member: userId })
export const setOffline = (userId: string) => redis.zrem(driversKey, userId)
export const onlineCount = () => redis.zcount(driversKey, Date.now() - staleMs, "+inf")
export async function isOnline(userId: string) {
  const seen = await redis.zscore(driversKey, userId)
  return seen !== null && seen > Date.now() - staleMs
}
