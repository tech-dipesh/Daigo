import { z } from "zod"

export const savedRouteSchema = z.object({
  label: z.string().min(2).max(30),
  fromLabel: z.string().min(1),
  fromLat: z.number(),
  fromLng: z.number(),
  toLabel: z.string().min(1),
  toLat: z.number(),
  toLng: z.number(),
  groupSize: z.number().int().min(1).max(5).default(1),
})

export const oneTapSchema = z.object({
  when: z.coerce.date().optional(),
  windowMinutes: z.number().int().min(10).max(120).default(30),
})

export type SavedRouteInput = z.infer<typeof savedRouteSchema>
export type OneTapInput = z.infer<typeof oneTapSchema>
