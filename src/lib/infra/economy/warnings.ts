import { db } from "@/lib/infra/clients/db"
import { sendEmailBestEffort } from "@/lib/infra/clients/email"
import { notify } from "@/lib/infra/realtime/notify"

type WarningReason = "GPS_SPOOF" | "CANCEL_GAMING" | "PRICE_OVER_CAP" | "LATE_ARRIVAL"

export const warningLimit = 5
const cycleDays = 90
const maxPerDay = 2
const dayMs = 24 * 60 * 60 * 1000
const istOffsetMs = 5.5 * 60 * 60 * 1000

export const startOfIstDay = (from = new Date()) => new Date(Math.floor((from.getTime() + istOffsetMs) / dayMs) * dayMs - istOffsetMs)

/*
  cycle is fixed 90 days from the first warning, not sliding
  when it runs out the count starts again from zero
*/
async function cycleStartOf(userId: string) {
  const { warningCycleStart } = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { warningCycleStart: true } })
  const live = warningCycleStart !== null && Date.now() - warningCycleStart.getTime() < cycleDays * dayMs
  return live ? warningCycleStart : null
}

export async function getWarningSummary(userId: string, scope: "current" | "all" = "current") {
  const start = await cycleStartOf(userId)
  const where = scope === "all" || !start ? { userId } : { userId, createdAt: { gte: start } }
  const none = scope === "current" && !start
  const [active, items] = await Promise.all([
    start ? db.warning.count({ where: { userId, revokedAt: null, createdAt: { gte: start } } }) : 0,
    none ? [] : db.warning.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
  ])
  const cycleEndsAt = start ? new Date(start.getTime() + cycleDays * dayMs) : null
  return { active, limit: warningLimit, cycleEndsAt, items }
}

async function ban(userId: string) {
  const user = await db.user.update({ where: { id: userId }, data: { isBanned: true }, select: { email: true } })
  const title = "Your DaiGo account was banned"
  const text = `Unfortunately you reached ${warningLimit} warnings within 90 days, so your account is permanently banned. If you think this is a mistake, you can appeal with a clear explanation.`
  await notify(userId, "BAN", title, text)
  await sendEmailBestEffort({ to: user.email, subject: title, text })
}

/*
  warnings are automatic only, max 2 a day
  so one bad day cant jump straight to a ban
*/
export async function issueWarning(userId: string, reason: WarningReason, note?: string, tripId?: string) {
  try {
    const today = await db.warning.count({ where: { userId, createdAt: { gte: startOfIstDay() } } })
    if (today >= maxPerDay) return null
    const cycle = await cycleStartOf(userId)
    const warning = await db.warning.create({ data: { userId, reason, note, tripId } })
    if (!cycle) await db.user.update({ where: { id: userId }, data: { warningCycleStart: warning.createdAt } })
    const { active } = await getWarningSummary(userId)
    const last = active === warningLimit - 1 ? " One more warning bans your account." : ""
    await notify(userId, "WARNING", "You got a warning", `${note ?? reason}. Warnings: ${active} of ${warningLimit}.${last}`, { warningId: warning.id })
    if (active >= warningLimit) await ban(userId)
    return warning
  } catch (error) {
    console.error("issue warning failed", error)
    return null
  }
}
