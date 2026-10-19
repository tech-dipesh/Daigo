import { db } from "@/lib/infra/clients/db"

const rates: ["BIKE" | "SCOOTER" | "AUTO" | "CAR" | "CAB", number][] = [["BIKE", 7], ["SCOOTER", 8], ["AUTO", 12], ["CAR", 15], ["CAB", 18]]

/*
  for diff area have diff with name, minLat/max, min/maxLat with the multiplier baed on the train
*/
const zones: [string, number, number, number, number, number][] = [
  ["North plains", 27.6, 32.6, 73.8, 77.6, 1.1],
  ["Himachal hills", 30.35, 33.25, 75.55, 79.0, 1.3],
  ["High Himalaya", 31.3, 32.9, 77.2, 78.9, 1.4],
  ["Chandigarh", 30.62, 30.8, 76.68, 76.88, 1.0],
  ["Mohali", 30.65, 30.75, 76.65, 76.8, 1.0],
  ["Panchkula", 30.65, 30.78, 76.8, 76.95, 1.0],
  ["Ludhiana", 30.85, 30.97, 75.78, 75.92, 1.0],
  ["Amritsar", 31.58, 31.7, 74.82, 74.95, 1.0],
  ["Jalandhar", 31.28, 31.38, 75.52, 75.62, 1.0],
  ["Patiala", 30.28, 30.38, 76.35, 76.45, 1.0],
  ["Ambala", 30.33, 30.43, 76.73, 76.83, 1.0],
  ["Gurugram", 28.38, 28.52, 76.93, 77.12, 1.0],
]

  ;(async () => {
  console.log("reach here let's see");
  const rateJobs = rates.map(([vehicleType, perKm]) => db.fareRate.upsert({ where: { vehicleType }, create: { vehicleType, perKm }, update: {} }))
  const zoneJobs = zones.map(([name, minLat, maxLat, minLng, maxLng, multiplier]) =>
    db.zone.upsert({ where: { name }, create: { name, minLat, maxLat, minLng, maxLng, multiplier }, update: {} }),
  )
  await Promise.all([...rateJobs, ...zoneJobs])
  console.log(`seeded ${rateJobs.length} rates, ${zoneJobs.length} zones`)
  await db.$disconnect()
})()
