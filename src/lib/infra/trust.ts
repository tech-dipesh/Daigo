import { db } from "@/lib/infra/db"
const ratingDeltas: Record<number, number> = { 5: 2, 4: 1, 3: 0, 2: -2, 1: -4 }
export const relayLatePenalty = 2

export const ratingDelta = (score: number) => ratingDeltas[score] ?? 0

export const clampTrust = (score: number) => Math.max(0, Math.min(100, score))

export function cancellationPenalty(cancelledBy: "RIDER" | "DRIVER", minutesSinceCommit: number) {
  // eating cap hit not free late
  if (cancelledBy === "RIDER") return 15
  return minutesSinceCommit < 10 ? 0 : minutesSinceCommit < 60 ? 3 : 8
}

export const vulnerableRequestTrustThreshold = 75;