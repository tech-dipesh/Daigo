import { RelayOfferView } from "@/features/driver/relay"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RelayOfferView id={id} />
}
