import { requireSuper } from "@/lib/admin-session"
import { Exports } from "@/features/admin/exports"

export default async function Page() {
  await requireSuper()
  return <Exports />
}
