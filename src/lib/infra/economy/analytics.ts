const istOffsetMs = 5.5 * 60 * 60 * 1000

export const istDay = (date: Date) => new Date(date.getTime() + istOffsetMs).toISOString().slice(0, 10)

export function countByDay(dates: Date[]) {
  const counts = new Map<string, number>()
  dates.forEach((d) => counts.set(istDay(d), (counts.get(istDay(d)) ?? 0) + 1))
  const days = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))
  return days.map(([day, count]) => ({ day, count }))
}
