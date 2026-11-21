import { SharedTrip } from "@/features/shared/trip-view"

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SharedTrip token={token} />
}
