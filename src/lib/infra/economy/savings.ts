import { db } from "@/lib/infra/clients/db"

const fallbackCabRate = 18

export async function cabRate() {
  const row = await db.fareRate.findUnique({ where: { vehicleType: "CAB" } })
  return row?.perKm ?? fallbackCabRate
}

/*
  saved = what a solo cab would cost for the same km minus what they paid
  relay trips have no km so they just show 0
*/
export const moneySaved = (km: number | null, price: number, cab: number) => (km === null ? 0 : Math.max(0, Math.round(km * cab) - price))
