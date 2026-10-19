import { db } from "@/lib/infra/clients/db"

const outside = { name: "Outside pilot area", multiplier: 1.1 }

export async function zoneMultiplier(lat: number, lng: number) {
  const zones = await db.zone.findMany({ where: { minLat: { lte: lat }, maxLat: { gte: lat }, minLng: { lte: lng }, maxLng: { gte: lng } } })
  const area = (z: (typeof zones)[number]) => (z.maxLat - z.minLat) * (z.maxLng - z.minLng)
  const bySize = zones.sort((a, b) => area(a) - area(b))
  const smallest = bySize[0]
  return smallest ? { name: smallest.name, multiplier: smallest.multiplier } : outside
}
