import { db } from "@/lib/infra/clients/db"
import { clampTrust } from "@/lib/infra/economy/trust"

type Client = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0]

export const findById = (id: string) => db.user.findUnique({ where: { id } })
export const getById = (id: string) => db.user.findUniqueOrThrow({ where: { id } })
export const findByEmail = (email: string) => db.user.findUnique({ where: { email } })
export const createUser = (email: string, passwordHash: string) => db.user.create({ data: { email, passwordHash } })
export const superAdmins = () => db.user.findMany({ where: { staffRole: "SUPER_ADMIN" } })

/*
  trust always moves through here so it stays between 0 and 100
  pass the tx when you are inside a transaction
*/
export async function adjustTrust(client: Client, userId: string, delta: number) {
  const { trustScore } = await client.user.findUniqueOrThrow({ where: { id: userId }, select: { trustScore: true } })
  return client.user.update({ where: { id: userId }, data: { trustScore: clampTrust(trustScore + delta) } })
}
