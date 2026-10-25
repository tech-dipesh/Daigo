import { AppError } from "@/lib/infra/http/response"
import { requireMember } from "@/lib/infra/auth/require-verified"
import { signRead, signUpload, objectSize } from "@/lib/infra/storage/s3"
import { deleteUpload, keyFor, maxUploadBytes, signedExpirySeconds } from "@/lib/infra/storage/uploads"
import * as uploadRepo from "@/lib/repository/upload-repo"
import type { UploadSignInput } from "@/lib/validation/upload-schema"

export async function signNewUpload(userId: string, { kind, contentType, sizeBytes }: UploadSignInput) {
  await requireMember(userId)
  const key = keyFor(kind, userId, contentType)
  const upload = await uploadRepo.create({ userId, kind, key, contentType, sizeBytes })
  const url = await signUpload(key, contentType, sizeBytes)
  return { uploadId: upload.id, url, method: "PUT", headers: { "Content-Type": contentType }, expiresInSeconds: signedExpirySeconds }
}

/*
  size is checked here after upload, presigned size alone is not trusted
*/
export async function confirmUpload(userId: string, id: string) {
  const upload = await uploadRepo.findOwned(id, userId)
  if (!upload) throw new AppError("Upload not found", 404)
  if (upload.status !== "PENDING") throw new AppError("This upload was already confirmed", 409)
  const size = await objectSize(upload.key)
  if (size === null) throw new AppError("File not found, upload it first", 409)
  if (size !== upload.sizeBytes || size > maxUploadBytes) {
    await deleteUpload(upload.id)
    throw new AppError("The uploaded file does not match what you declared", 422)
  }
  return uploadRepo.markUploaded(id)
}

export async function readLink(id: string) {
  const upload = await uploadRepo.findUploaded(id)
  if (!upload) throw new AppError("File not found or already deleted", 404)
  return { url: await signRead(upload.key), expiresInSeconds: signedExpirySeconds }
}
