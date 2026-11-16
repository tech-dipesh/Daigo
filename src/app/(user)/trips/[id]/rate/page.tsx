import { Rate } from "@/features/trips/rate"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Rate id={id} />
}
