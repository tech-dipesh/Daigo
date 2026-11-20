import { DriverTrip } from "@/features/driver/trip"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DriverTrip id={id} />
}
