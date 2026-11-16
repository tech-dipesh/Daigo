import { Report } from "@/features/trips/report"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Report id={id} />
}
