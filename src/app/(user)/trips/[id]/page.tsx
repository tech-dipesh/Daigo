import { TripDetail } from "@/features/trips/detail"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TripDetail id={id} />
}
