import { LoginForm } from "@/features/auth/login-form"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string }> }) {
  const { email, next } = await searchParams
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined
  return <LoginForm start={email} next={safe} />
}
