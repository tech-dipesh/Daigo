import { LoginForm } from "@/features/auth/login-form"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return <LoginForm start={email} />
}
