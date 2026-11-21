import { requireSuper } from "@/lib/admin-session"
import { Staff } from "@/features/admin/staff"

export default async function Page() {
  await requireSuper()
  return <Staff />
}
