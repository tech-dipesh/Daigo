import { randomUUID } from "node:crypto"
import { db } from "@/lib/infra/clients/db"
import { AppError } from "@/lib/infra/http/response"
import { removeObject } from "@/lib/infra/storage/s3"

export const maxUploadBytes = 5 * 1024 * 1024
export const allowedTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const
export const signedExpirySeconds = 300

export const keyFor = (kind: string, userId: string, contentType: keyof typeof allowedTypes) => `${kind.toLowerCase()}/${userId}/${randomUUID()}.${allowedTypes[contentType]}`

export async function assertOwnUpload(uploadId: string, userId: string, kind: "LICENCE" | "RC") {
  const upload = await db.upload.findFirst({ where: { id: uploadId, userId, kind, status: "UPLOADED" } })
  if (!upload) throw new AppError("Upload your photo first and send its uploadId", 400)
}

/*
  licence and rc photos are deleted once admin reviews them
  if s3 fails we just log, the row stays so we can retry
*/
export async function deleteUpload(uploadId: string | null) {
  if (!uploadId) return
  try {
    const upload = await db.upload.findUnique({ where: { id: uploadId } })
    if (!upload || upload.status === "DELETED") return
    await removeObject(upload.key)
    await db.upload.update({ where: { id: uploadId }, data: { status: "DELETED", deletedAt: new Date() } })
  } catch (error) {
    console.error("delete upload failed", error)
  }
}
