import { TripChat } from "@/features/trips/chat"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TripChat id={id} />
}
