import { IncomingAlert } from "@/features/driver/incoming-alert"

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  return <IncomingAlert matchId={matchId} />
}
