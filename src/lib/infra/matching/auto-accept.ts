import { AppError } from "@/lib/infra/http/response"
import { acceptMatch } from "@/lib/infra/matching/accept-match"

type Candidate = {
  id: string
  priceEstimate: number
  route: { autoAccept: boolean; autoMinPrice: number | null; autoMinPerKm: number | null; autoMinTrust: number | null }
}

export async function tryAutoAccept(candidates: Candidate[], riderTrust: number, km: number) {
  const perKm = (price: number) => price / Math.max(km, 1)
  const enabled = candidates.filter((m) => m.route.autoAccept)
  const eligible = enabled.filter((m) => m.priceEstimate >= (m.route.autoMinPrice ?? 0) && perKm(m.priceEstimate) >= (m.route.autoMinPerKm ?? 0) && riderTrust >= (m.route.autoMinTrust ?? 0))
  for (const candidate of eligible) {
    try {
      return await acceptMatch(candidate.id)
    } catch (error) {
      if (!(error instanceof AppError)) throw error
    }
  }
  return null
}
