import { ConfirmLink } from "@/features/auth/confirm-link"

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return <ConfirmLink token={token ?? ""} />
}
