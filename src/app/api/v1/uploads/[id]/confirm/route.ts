import { db } from "@/lib/infra/clients/db"
import { getUserId } from "@/lib/infra/auth/auth"
import { AppError, successResponse } from "@/lib/infra/http/response"
import { withErrorHandling } from "@/lib/infra/http/with-error-handling"
import { idFrom } from "@/lib/infra/http/route-params"
import { objectSize } from "@/lib/infra/storage/s3"
import { deleteUpload, maxUploadBytes } from "@/lib/infra/storage/uploads"
import type { RouteParams } from "@/types/api"

/*
  size is checked here after upload, presigned size alone is not trusted
*/
export const POST = withErrorHandling<RouteParams>(async (request, { params }) => {
  const userId = getUserId(request)
  const id = await idFrom(params)
  const upload = await db.upload.findFirst({ where: { id, userId } })
  if (!upload) throw new AppError("Upload not found", 404)
  if (upload.status !== "PENDING") throw new AppError("This upload was already confirmed", 409)
  const size = await objectSize(upload.key)
  if (size === null) throw new AppError("File not found, upload it first", 409)
  if (size !== upload.sizeBytes || size > maxUploadBytes) {
    await deleteUpload(upload.id)
    throw new AppError("The uploaded file does not match what you declared", 422)
  }
  const confirmed = await db.upload.update({ where: { id }, data: { status: "UPLOADED" } })
  return successResponse(confirmed)
})
