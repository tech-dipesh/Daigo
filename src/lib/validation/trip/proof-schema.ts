import { z } from "zod"

export const proofSchema = z.object({ proofUploadId: z.uuid() })

export type ProofInput = z.infer<typeof proofSchema>
