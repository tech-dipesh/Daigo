import { z } from "zod"

export const userSearchSchema = z.object({ q: z.string().trim().max(60).optional(), staff: z.enum(["true", "false"]).default("false") })

export type UserSearchInput = z.infer<typeof userSearchSchema>
