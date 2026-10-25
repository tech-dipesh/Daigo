import { compare, hash } from "bcryptjs"

const cost = 12

export const hashPassword = (plain: string) => hash(plain, cost)
export const verifyPassword = (plain: string, hashed: string) => compare(plain, hashed)
