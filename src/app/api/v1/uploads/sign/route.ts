import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { parseJsonBody } from "@/lib/infra/http/request"
import { signUpload } from "@/lib/infra/storage/s3"
import { keyFor, signedExpirySeconds } from "@/lib/infra/storage/uploads"
import { uploadSignSchema } from "@/lib/validation/upload-schema"

export const POST = withErrorHandling(async (request) => {
  const userId = getUserId(request)
  await requireMember(userId)
  const { kind, contentType, sizeBytes } = uploadSignSchema.parse(await parseJsonBody(request))
  const key = keyFor(kind, userId, contentType)
  const upload = await db.upload.create({ data: { userId, kind, key, contentType, sizeBytes } })
  const url = await signUpload(key, contentType, sizeBytes)
  return successResponse({ uploadId: upload.id, url, method: "PUT", headers: { "Content-Type": contentType }, expiresInSeconds: signedExpirySeconds }, 201)
})
