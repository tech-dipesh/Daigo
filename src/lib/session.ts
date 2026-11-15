import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import * as userRepo from "@/lib/repository/account/user-repo"
import * as emergencyRepo from "@/lib/repository/safety/emergency-repo"
import * as vehicleRepo from "@/lib/repository/driver/vehicle-repo"
import * as documentRepo from "@/lib/repository/driver/driver-document-repo"

type Opts = { staff?: boolean; role?: "RIDER" | "DRIVER"; unverified?: boolean; noContact?: boolean; banned?: boolean; setup?: boolean }
type Step = "vehicle" | "licence" | "done"

export const getSession = cache(async () => {
  const id = (await headers()).get("x-user-id")
  if (!id) return null
  const [user, roles, contacts] = await Promise.all([userRepo.profile(id), userRepo.roles(id), emergencyRepo.listContacts(id)])
  if (!user) return null
  const driving = user.activeRole === "DRIVER" && !roles.staffRole
  const [vehicles, licences] = driving ? await Promise.all([vehicleRepo.listByOwner(id), documentRepo.listByUser(id)]) : [[], []]
  const driverStep: Step = !driving ? "done" : !vehicles.length ? "vehicle" : !licences.length ? "licence" : "done"
  return { ...user, staffRole: roles.staffRole, hasContact: contacts.length > 0, driverStep }
})

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>

export function landing(s: Session) {
  if (s.staffRole) return "/admin"
  if (!s.emailVerifiedAt) return "/verify-email"
  if (!s.hasContact) return "/onboarding/emergency-contact"
  if (s.isBanned) return "/me/standing"
  if (s.activeRole !== "DRIVER") return "/home"
  return s.driverStep === "done" ? "/driver" : `/onboarding/driver/${s.driverStep}`
}

export async function requireUser({ staff, role, unverified, noContact, banned, setup }: Opts = {}) {
  const s = await getSession()
  if (!s) redirect("/login")
  if (s.staffRole) return staff ? s : redirect("/admin")
  if (staff) redirect("/")
  if (!s.emailVerifiedAt && !unverified) redirect("/verify-email")
  if (!s.hasContact && !noContact) redirect("/onboarding/emergency-contact")
  if (s.isBanned && !banned) redirect("/me/standing")
  if (role && s.activeRole !== role) redirect("/")
  if (role === "DRIVER" && !setup && s.driverStep !== "done") redirect(landing(s))
  return s
}
