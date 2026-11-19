import { RouteDetail } from "@/features/driver/route-detail"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RouteDetail id={id} />
}
