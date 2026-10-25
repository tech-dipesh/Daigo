import { db } from "@/lib/infra/clients/db"
import { clampTrust } from "@/lib/infra/economy/trust"

type Client = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0]

export const findById = (id: string) => db.user.findUnique({ where: { id } })
export const getById = (id: string) => db.user.findUniqueOrThrow({ where: { id } })
export const findByEmail = (email: string) => db.user.findUnique({ where: { email } })
export const createUser = (email: string, passwordHash: string) => db.user.create({ data: { email, passwordHash } })
export const staffInfo = (id: string) => db.user.findUnique({ where: { id }, select: { id: true, staffRole: true } })
const profileSelect = { id: true, email: true, name: true, language: true, emailVerifiedAt: true, activeRole: true, trustScore: true, isBanned: true, createdAt: true } as const
type ProfileChanges = { activeRole?: "RIDER" | "DRIVER"; name?: string; language?: "EN" | "NE" | "HI"; email?: string; emailVerifiedAt?: null }

export const profile = (id: string) => db.user.findUnique({ where: { id }, select: profileSelect })
export const verifyEmail = (id: string) => db.user.update({ where: { id }, data: { emailVerifiedAt: new Date() }, select: { id: true, email: true, emailVerifiedAt: true } })
export const updateProfile = (id: string, data: ProfileChanges) => db.user.update({ where: { id }, data, select: { id: true, email: true, name: true, language: true, activeRole: true } })

/* new password and every old session dies together */
export const resetPassword = (userId: string, passwordHash: string) =>
  db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } })
    await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
  })

export const superAdmins = () => db.user.findMany({ where: { staffRole: "SUPER_ADMIN" } })

/*
  trust always moves through here so it stays between 0 and 100
  pass the tx when you are inside a transaction
*/
export async function adjustTrust(client: Client, userId: string, delta: number) {
  const { trustScore } = await client.user.findUniqueOrThrow({ where: { id: userId }, select: { trustScore: true } })
  return client.user.update({ where: { id: userId }, data: { trustScore: clampTrust(trustScore + delta) } })
}

export const rename = (id: string, name: string) => db.user.update({ where: { id }, data: { name } })
export const withPrimaryContact = (id: string) => db.user.findUniqueOrThrow({ where: { id }, include: { emergencyContacts: { where: { isPrimary: true }, take: 1 } } })
export const setStaffRole = (id: string, staffRole: "MODERATOR" | "SUPER_ADMIN" | null) => db.user.update({ where: { id }, data: { staffRole }, select: { id: true, email: true, staffRole: true } })
export const roles = (id: string) => db.user.findUniqueOrThrow({ where: { id }, select: { activeRole: true, staffRole: true } })
export const adjustTrustNow = (userId: string, delta: number) => adjustTrust(db, userId, delta)
