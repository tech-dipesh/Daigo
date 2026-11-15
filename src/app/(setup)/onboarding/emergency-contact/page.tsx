import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { ContactForm } from "@/features/onboarding/contact-form"

export default async function ContactPage() {
  const s = await requireUser({ noContact: true })
  if (s.hasContact) redirect("/")
  return <ContactForm />
}
