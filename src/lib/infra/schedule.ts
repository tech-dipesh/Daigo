type ScheduleFields = {
  routeType: "REGULAR" | "ADVANCE"
  daysOfWeek: number[]
  departureDate: Date | null
  departureTime: Date
}

const oneDayMs = 24 * 60 * 60 * 1000

function combineDateAndTime(date: Date, time: Date) {
  const combined = new Date(date)
  // fix the timing of the hour minute
  combined.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0)
  return combined
}

function regularDepartsInWindow(route: ScheduleFields, windowStart: Date, windowEnd: Date) {
  const startDay = new Date(
    Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()),
  )
  const endDay = new Date(
    Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()),
  )

  for (let day = startDay; day <= endDay; day = new Date(day.getTime() + oneDayMs)) {
    if (!route.daysOfWeek.includes(day.getUTCDay())) continue

    const departure = combineDateAndTime(day, route.departureTime)
    if (departure >= windowStart && departure <= windowEnd) return true
  }

  return false
}
