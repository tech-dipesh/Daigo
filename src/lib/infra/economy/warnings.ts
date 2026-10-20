import { db } from "@/lib/infra/clients/db"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { notify } from "@/lib/infra/realtime/notify"

type WarningReason = "GPS_SPOOF" | "CANCEL_GAMING" | "LATE_ARRIVAL" | "PRICE_OVER_CAP"
type Standing = { isBanned: boolean; suspendedFrom: Date | null; suspendedUntil: Date | null }

export const warningLimit = 5
export const banAtSuspension = 3
const windowDays = 90
const maxPerDay = 2
const suspensionDays = 30
const dayMs = 24 * 60 * 60 * 1000
const istOffsetMs = 5.5 * 60 * 60 * 1000

export const startOfIstDay = (from = new Date()) => new Date(Math.floor((from.getTime() + istOffsetMs) / dayMs) * dayMs - istOffsetMs)
export const nextIstMidnight = (from = new Date()) => new Date(startOfIstDay(from).getTime() + dayMs)

export function isSuspended(user: Standing, now = new Date()) {
  const running = user.suspendedFrom !== null && user.suspendedUntil !== null && user.suspendedFrom <= now && now < user.suspendedUntil
  return user.isBanned || running
}

export async function activeWarningCount(userId: string) {
  const { warningsResetAt } = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { warningsResetAt: true } })
  const windowStart = new Date(Date.now() - windowDays * dayMs)
  const since = warningsResetAt && warningsResetAt > windowStart ? warningsResetAt : windowStart
  return db.warning.count({ where: { userId, revokedAt: null, createdAt: { gte: since } } })
}

async function suspend(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, suspensionCount: true } })
  const count = user.suspensionCount + 1
  const banned = count >= banAtSuspension
  const from = nextIstMidnight()
  const until = new Date(from.getTime() + suspensionDays * dayMs)
  await db.user.update({
    where: { id: userId },
    data: { suspensionCount: count, warningsResetAt: new Date(), isBanned: banned, suspendedFrom: banned ? null : from, suspendedUntil: banned ? null : until },
  })
  const title = banned ? "Your account was banned" : "Your account was suspended"
  const text = banned ? `You reached ${warningLimit} warnings for the ${count}rd time, so the account is banned. You can appeal.` : `You reached ${warningLimit} warnings. Rider and driver features pause from midnight IST for ${suspensionDays} days. You can appeal.`
  await notify(userId, "SUSPENSION", title, text, { count })
  await sendEmailBestEffort({ to: user.email, subject: title, text })
}

/*
  warnings are automatic only, max 2 a day
  so one bad day cant jump straight to a suspension
*/
export async function issueWarning(userId: string, reason: WarningReason, note?: string, tripId?: string) {
  try {
    const today = await db.warning.count({ where: { userId, createdAt: { gte: startOfIstDay() } } })
    if (today >= maxPerDay) return null
    const warning = await db.warning.create({ data: { userId, reason, note, tripId } })
    const active = await activeWarningCount(userId)
    await notify(userId, "WARNING", "You got a warning", `${note ?? reason}. Active warnings: ${active} of ${warningLimit}.`, { warningId: warning.id })
    if (active >= warningLimit) await suspend(userId)
    return warning
  } catch (error) {
    console.error("issue warning failed", error)
    return null
  }
}
