import { notFound } from "next/navigation"
import { requireSuper } from "@/lib/admin-session"
import { DemoPage } from "@/features/admin/demo"
import { demoTabs } from "@/features/admin/demo-tabs"

export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  await requireSuper()
  const { tab } = await params
  const known = demoTabs.find((x) => x === tab)
  if (!known) notFound()
  return <DemoPage tab={known} />
}
