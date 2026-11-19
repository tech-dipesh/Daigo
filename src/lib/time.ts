const zone = "Asia/Kolkata"
const offset = 330
const pad = (n: number) => String(n).padStart(2, "0")
const hm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

export const clock = (d: string | number | Date) => new Intl.DateTimeFormat("en-IN", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d))
export const dayMonth = (d: string | number | Date) => new Intl.DateTimeFormat("en-IN", { timeZone: zone, day: "numeric", month: "short" }).format(new Date(d))
export const stamp = (d: string | number | Date) => `${dayMonth(d)}, ${clock(d)}`
export const clockOf = (t: string) => clock(`1970-01-01T${t}:00+05:30`)

export function toUtc(time: string, days: number[]) {
  const total = minutes(time) - offset
  const shift = total < 0 ? -1 : 0
  return { time: hm((total + 1440) % 1440), days: days.map((d) => (d + shift + 7) % 7) }
}

export function fromUtc(time: string, days: number[]) {
  const total = minutes(time) + offset
  const shift = total >= 1440 ? 1 : 0
  return { time: hm(total % 1440), days: days.map((d) => (d + shift) % 7) }
}

export function advanceToUtc(date: string, time: string) {
  const iso = new Date(`${date}T${time}:00+05:30`).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) }
}

export const nextMorning = () => {
  const now = new Date(Date.now() + offset * 60000)
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 6, 0) - offset * 60000
  return next
}
