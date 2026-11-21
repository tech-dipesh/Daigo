import { PayShare } from "@/features/paynshare/pay-share"

export default async function Page({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  return <PayShare id={shareId} />
}
