import { Board } from "@/features/offers/board"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Board id={id} />
}
