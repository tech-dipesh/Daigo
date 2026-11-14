import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import * as userRepo from "@/lib/repository/account/user-repo"
import * as emergencyRepo from "@/lib/repository/safety/emergency-repo"

type Opts = { staff?: boolean; role?: "RIDER" | "DRIVER"; unverified?: boolean; noContact?: boolean; banned?: boolean }

export const getSession = cache(async () => {
  const id = (await headers()).get("x-user-id")
  if (!id) return null
  const [user, roles, contacts] = await Promise.all([userRepo.profile(id), userRepo.roles(id), emergencyRepo.listContacts(id)])
  return user ? { ...user, staffRole: roles.staffRole, hasContact: contacts.length > 0 } : null
})

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>

export function landing(s: Session) {
  if (s.staffRole) return "/admin"
  if (!s.emailVerifiedAt) return "/verify-email"
  if (!s.hasContact) return "/onboarding/emergency-contact"
  if (s.isBanned) return "/me/standing"
  return s.activeRole === "DRIVER" ? "/driver" : "/home"
}

export async function requireUser({ staff, role, unverified, noContact, banned }: Opts = {}) {
  const s = await getSession()
  if (!s) redirect("/login")
  if (s.staffRole) return staff ? s : redirect("/admin")
  if (staff) redirect("/")
  if (!s.emailVerifiedAt && !unverified) redirect("/verify-email")
  if (!s.hasContact && !noContact) redirect("/onboarding/emergency-contact")
  if (s.isBanned && !banned) redirect("/me/standing")
  if (role && s.activeRole !== role) redirect("/")
  return s
}
