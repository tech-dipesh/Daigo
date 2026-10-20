import { db } from "@/lib/infra/clients/db"
import { requireStaff } from "@/lib/infra/auth/admin-access"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { signRead } from "@/lib/infra/storage/s3"
import { signedExpirySeconds } from "@/lib/infra/storage/uploads"
import type { RouteParams } from "@/types/api"

export const GET = withErrorHandling<RouteParams>(async (request, { params }) => {
  await requireStaff(request)
  const id = await idFrom(params)
  const upload = await db.upload.findFirst({ where: { id, status: "UPLOADED" } })
  if (!upload) throw new AppError("File not found or already deleted", 404)
  const url = await signRead(upload.key)
  return successResponse({ url, expiresInSeconds: signedExpirySeconds })
})
