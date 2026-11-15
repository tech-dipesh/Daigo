import { SignupForm } from "@/features/auth/signup-form"

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return <SignupForm start={email} />
}
