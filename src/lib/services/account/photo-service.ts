import { AppError } from "@/lib/infra/http/response"
import { signRead } from "@/lib/infra/storage/s3"
import * as photoRepo from "@/lib/repository/account/photo-repo"
import * as uploadRepo from "@/lib/repository/driver/upload-repo"
import type { PhotoInput } from "@/lib/validation/account/photo-schema"

export async function setPhoto(userId: string, { uploadId }: PhotoInput) {
  const upload = await uploadRepo.findOwned(uploadId, userId)
  if (!upload || upload.kind !== "PROFILE_PHOTO" || upload.status !== "UPLOADED") throw new AppError("Upload the photo first", 422)
  return photoRepo.setPhotoUrl(userId, `/api/v1/photos/${userId}`)
}

export async function photoLink(userId: string) {
  const upload = await photoRepo.latestPhoto(userId)
  if (!upload) throw new AppError("No photo", 404)
  return signRead(upload.key, 120)
}
