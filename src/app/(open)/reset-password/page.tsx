import { ResetForm } from "@/features/auth/reset-form"

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return <ResetForm token={token ?? ""} />
}
