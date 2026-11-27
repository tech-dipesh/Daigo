import { redis } from "@/lib/infra/clients/redis"
import { adminChannel, wakeChannel } from "@/lib/infra/realtime/events"
import type { RealtimeEvent } from "@/lib/infra/realtime/events"

type Listener = (event: RealtimeEvent) => void
type Close = () => Promise<void>

const users = new Map<string, Set<Listener>>()
const admins = new Set<Listener>()
const wakers = new Set<() => void>()
const pingUser = "user:__ping"
const pingEveryMs = 60000
const quietMs = 150000
let started = false
let seenUsers = Date.now()
let seenRest = Date.now()
let closers: Close[] = []

const idOf = (channel: string) => channel.slice("user:".length)
const send = (set: Set<Listener> | undefined, event: RealtimeEvent) => set?.forEach((fn) => fn(event))

/*
  upstash sends messages over one long http stream per subscription and the sdk only logs when that stream breaks
  it never reconnects, so the process would just go deaf. two streams for everyone, not one per socket
  both get a ping every minute, if one stays quiet it is dropped and opened again
*/
function connect() {
  seenUsers = Date.now()
  seenRest = Date.now()
  const people = redis.psubscribe<RealtimeEvent>(["user:*"])
  people.on("pmessage", ({ channel, message }) => {
    seenUsers = Date.now()
    send(users.get(idOf(channel)), message)
  })
  const rest = redis.subscribe<RealtimeEvent>([adminChannel, wakeChannel])
  rest.on("message", ({ channel, message }) => {
    seenRest = Date.now()
    if (channel === adminChannel) send(admins, message)
    else wakers.forEach((wake) => wake())
  })
  closers = [() => people.unsubscribe(), () => rest.unsubscribe()]
}

async function reconnect() {
  console.error("a redis subscription went quiet, opening it again")
  await Promise.allSettled(closers.map((close) => close()))
  connect()
}

async function check() {
  try { await Promise.all([redis.publish(pingUser, "1"), redis.publish(wakeChannel, "1")]) } catch (err) { console.error("ping failed", err) }
  const now = Date.now()
  if (now - seenUsers > quietMs || now - seenRest > quietMs) await reconnect()
}

export function startHub() {
  if (started) return
  started = true
  connect()
  setInterval(() => void check(), pingEveryMs)
}

export function onWake(fn: () => void) {
  startHub()
  wakers.add(fn)
}

/* returns the function that stops listening */
export function listen(userId: string, staff: boolean, fn: Listener) {
  startHub()
  const mine = users.get(userId) ?? new Set<Listener>()
  mine.add(fn)
  users.set(userId, mine)
  if (staff) admins.add(fn)
  return () => {
    mine.delete(fn)
    if (!mine.size) users.delete(userId)
    admins.delete(fn)
  }
}
