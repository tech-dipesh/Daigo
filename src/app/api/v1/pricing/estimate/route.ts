import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { buildPricing } from "@/lib/infra/economy/pricing"
import { priceEstimateQuerySchema } from "@/lib/validation/request-schema"

export const GET = withErrorHandling(async (request) => {
  const { when, groupSize, minor, ...points } = priceEstimateQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const pricing = await buildPricing({ ...points, groupSize, minor: minor === "true", when: when ?? new Date() })
  const types = groupSize > 1 ? ["AUTO", "CAR", "CAB"] : ["BIKE", "SCOOTER", "AUTO", "CAR", "CAB"]
  const quotes = types.map((type) => pricing.quote(type))
  return successResponse({ distanceKm: pricing.distanceKm, minutes: pricing.minutes, zones: pricing.zones, quotes })
})
