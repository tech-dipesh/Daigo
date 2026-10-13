const perKmRateByVehicleType: Record<string, number> = {
  BIKE: 7,
  SCOOTER: 8,
  AUTO: 12,
  CAR: 15,
  CAB: 18,
}

const maxPerKmRate = 40
const absolutePriceCap = 2000

export function estimatePrice(vehicleType: string, tripDistanceKm: number): number {
  const baseRate = perKmRateByVehicleType[vehicleType] ?? maxPerKmRate
  const cappedRate = Math.min(baseRate, maxPerKmRate)

  const rawPrice = cappedRate * tripDistanceKm
  const roundedPrice = Math.round(rawPrice)

  return Math.min(roundedPrice, absolutePriceCap)
}
