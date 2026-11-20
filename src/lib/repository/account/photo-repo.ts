import { db } from "@/lib/infra/clients/db"

export const latestPhoto = (userId: string) => db.upload.findFirst({ where: { userId, kind: "PROFILE_PHOTO", status: "UPLOADED", deletedAt: null }, orderBy: { createdAt: "desc" } })
export const setPhotoUrl = (userId: string, profilePhotoUrl: string) => db.user.update({ where: { id: userId }, data: { profilePhotoUrl }, select: { id: true, profilePhotoUrl: true } })
