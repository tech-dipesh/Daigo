import { Waiting } from "@/features/rider/waiting"

export default async function WaitingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Waiting id={id} />
}
