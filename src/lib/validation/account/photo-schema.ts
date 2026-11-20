import { z } from "zod"

export const photoSchema = z.object({ uploadId: z.uuid() })

export type PhotoInput = z.infer<typeof photoSchema>
