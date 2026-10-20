import { z } from "zod"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { buildPricing } from "@/lib/infra/economy/pricing"

const querySchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
  groupSize: z.coerce.number().int().min(1).max(5).default(1),
  when: z.coerce.date().optional(),
  minor: z.enum(["true", "false"]).default("false"),
})

export const GET = withErrorHandling(async (request) => {
  const { when, groupSize, minor, ...points } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  const pricing = await buildPricing({ ...points, groupSize, minor: minor === "true", when: when ?? new Date() })
  const types = groupSize > 1 ? ["AUTO", "CAR", "CAB"] : ["BIKE", "SCOOTER", "AUTO", "CAR", "CAB"]
  const quotes = types.map((type) => pricing.quote(type))
  return successResponse({ distanceKm: pricing.distanceKm, minutes: pricing.minutes, zones: pricing.zones, quotes })
})
