import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { VerifyForm } from "@/features/auth/verify-form"

export default async function VerifyPage() {
  const s = await requireUser({ unverified: true, noContact: true, banned: true })
  if (s.emailVerifiedAt) redirect("/")
  return <VerifyForm email={s.email} />
}
