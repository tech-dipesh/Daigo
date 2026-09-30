import { z } from "zod"
import { db } from "@/lib/infra/db"
type GeoCandidateParams = {
  riderId: string
  groupSize: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}

export async function findGeoCandidates(params: GeoCandidateParams) {
  const { riderId, groupSize, fromLat, fromLng, toLat, toLng } = params
  return "Geo Candiate"
}
