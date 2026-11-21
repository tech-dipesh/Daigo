import { requireSuper } from "@/lib/admin-session"
import { DemoHub } from "@/features/admin/demo"

export default async function Page() {
  await requireSuper()
  return <DemoHub />
}
