import { requireUser } from "@/lib/session"
import { LicenceForm } from "@/features/onboarding/licence-form"

export default async function LicencePage() {
  await requireUser({ role: "DRIVER", setup: true })
  return <LicenceForm />
}
