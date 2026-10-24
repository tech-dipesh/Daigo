import { z } from "zod"
import { maxUploadBytes } from "@/lib/infra/storage/uploads"

export const uploadSignSchema = z.object({
  kind: z.enum(["LICENCE", "RC", "PAYMENT_PROOF", "PROFILE_PHOTO"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().min(1).max(maxUploadBytes),
})
